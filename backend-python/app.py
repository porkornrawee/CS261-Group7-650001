"""เว็บแอปจองที่จอดรถ (US7): Flask + SQLite + QR Code

รัน:   python app.py          แล้วเปิด http://127.0.0.1:5000
ทดสอบ: python -m unittest discover -s tests -v
"""

import os
from datetime import datetime

from flask import Flask, Response, g, jsonify, request

from auth import login_required, student_from_session
import booking_service as service
import history_service
import notification_service
import qr_service
import vehicle_service
from db import connect, init_db

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def create_app(db_path=None, now_func=None):
    """สร้างแอป (รับ db_path และ now_func เพื่อให้ทดสอบแยกอิสระได้)"""
    app = Flask(__name__, static_folder=os.path.join(BASE_DIR, "static"))
    app.json.ensure_ascii = False  # ให้ JSON แสดงภาษาไทยตรง ๆ ไม่เป็น \uXXXX
    app.config["SECRET_KEY"] = os.environ.get("FLASK_SECRET_KEY")
    app.config["DB_PATH"] = (
        db_path
        or os.environ.get("PARKING_DB")
        or os.path.join(BASE_DIR, "parking.db")
    )
    app.config["NOW_FUNC"] = now_func or datetime.now
    init_db(app.config["DB_PATH"])
    vehicles = {}  # ทะเบียนรถจำลอง (student_id -> รถ) อยู่ในหน่วยความจำ

    # --- จัดการ connection: 1 request = 1 connection -----------------------

    def get_conn():
        if "conn" not in g:
            g.conn = connect(app.config["DB_PATH"])
        return g.conn

    @app.teardown_appcontext
    def close_conn(_exception):
        conn = g.pop("conn", None)
        if conn is not None:
            conn.close()

    @app.before_request
    def bind_student_from_session():
        student_from_session()

    # --- รูปแบบ error ให้เหมือนกันทุกเส้นทาง -------------------------------

    @app.errorhandler(service.BookingError)
    def handle_booking_error(error):
        body = {"ok": False, "error": {"code": error.code, "message": error.message}}
        return jsonify(body), error.http_status

    def not_found(message):
        return jsonify({"ok": False, "error": {"code": "NOT_FOUND", "message": message}}), 404

    # --- หน้าเว็บ -----------------------------------------------------------

    @app.get("/")
    def index():
        return app.send_static_file("index.html")

    # --- API ----------------------------------------------------------------

    @app.post("/api/vehicles/verify")
    def api_verify_student():
        student = vehicle_service.verify_student(request.get_json(silent=True))
        return jsonify({"ok": True, "student": student})

    @app.post("/api/vehicles")
    def api_save_vehicle():
        vehicle = vehicle_service.save_vehicle(vehicles, request.get_json(silent=True))
        return jsonify({"ok": True, "vehicle": vehicle}), 201

    @app.get("/api/zones")
    def api_zones():
        return jsonify(service.get_layout(get_conn()))

    @app.get("/api/availability")
    def api_availability():
        result = service.get_availability(
            get_conn(),
            request.args.get("date"),
            request.args.get("start"),
            request.args.get("end"),
        )
        return jsonify(result)

    @app.post("/api/reservations")
    def api_create_reservation():
        payload = request.get_json(silent=True)
        reservation = service.create_reservation(
            get_conn(), payload, app.config["NOW_FUNC"](),
            student_id=getattr(g, "student_id", None),
        )
        png = qr_service.make_qr_png(reservation["code"])
        body = {
            "ok": True,
            "reservation": reservation,
            "qr_data_uri": qr_service.to_data_uri(png),
            "qr_url": f"/api/reservations/{reservation['code']}/qr.png",
        }
        return jsonify(body), 201

    @app.get("/api/reservations")
    def api_list_reservations():
        limit = min(max(request.args.get("limit", default=20, type=int), 1), 100)
        return jsonify({"reservations": service.list_reservations(get_conn(), limit)})

    @app.get("/api/me/reservations")
    @login_required
    def api_my_reservations():
        status = request.args.get("status", "")
        try:
            reservations = history_service.list_my_reservations(
                get_conn(), g.student_id, status, app.config["NOW_FUNC"]()
            )
        except ValueError:
            return jsonify({
                "ok": False,
                "error": {"code": "VALIDATION_ERROR", "message": "สถานะประวัติไม่ถูกต้อง"},
            }), 400
        return jsonify({"ok": True, "reservations": reservations})

    @app.get("/api/me/notifications")
    @login_required
    def api_my_notifications():
        conn = get_conn()
        now = app.config["NOW_FUNC"]()
        notification_service.generate_due_notifications(conn, now)
        rows = conn.execute(
            """SELECT id, reservation_id, type, message, created_at, read_at
               FROM notifications WHERE student_id = ?
               ORDER BY created_at DESC, id DESC LIMIT 100""",
            (g.student_id,),
        ).fetchall()
        notifications = [dict(row) for row in rows]
        unread_count = conn.execute(
            "SELECT COUNT(*) FROM notifications WHERE student_id = ? AND read_at IS NULL",
            (g.student_id,),
        ).fetchone()[0]
        return jsonify({
            "ok": True,
            "notifications": notifications,
            "unread_count": unread_count,
        })

    @app.post("/api/me/notifications/<int:notification_id>/read")
    @login_required
    def api_mark_notification_read(notification_id):
        conn = get_conn()
        row = conn.execute(
            """SELECT id, student_id, reservation_id, type, message, created_at, read_at
               FROM notifications WHERE id = ?""",
            (notification_id,),
        ).fetchone()
        if row is None:
            return not_found("ไม่พบการแจ้งเตือนนี้")
        if row["student_id"] != g.student_id:
            return jsonify({
                "ok": False,
                "error": {"code": "FORBIDDEN", "message": "คุณไม่มีสิทธิ์ดำเนินการนี้"},
            }), 403

        now = app.config["NOW_FUNC"]().isoformat(timespec="seconds")
        conn.execute(
            "UPDATE notifications SET read_at = COALESCE(read_at, ?) WHERE id = ?",
            (now, notification_id),
        )
        row = conn.execute(
            """SELECT id, reservation_id, type, message, created_at, read_at
               FROM notifications WHERE id = ?""",
            (notification_id,),
        ).fetchone()
        return jsonify({"ok": True, "notification": dict(row)})

    @app.get("/api/reservations/<code>")
    def api_get_reservation(code):
        reservation = service.get_reservation_by_code(get_conn(), code)
        if reservation is None:
            return not_found("ไม่พบรหัสการจองนี้")
        return jsonify({"ok": True, "reservation": reservation})

    @app.get("/api/reservations/<code>/qr.png")
    def api_reservation_qr(code):
        reservation = service.get_reservation_by_code(get_conn(), code)
        if reservation is None:
            return not_found("ไม่พบรหัสการจองนี้")
        return Response(qr_service.make_qr_png(reservation["code"]), mimetype="image/png")

    return app


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    create_app().run(host=os.environ.get("HOST", "127.0.0.1"), port=port, debug=False, threaded=True)
