"""US12 — ยกเลิกการจองอัตโนมัติเมื่อไม่มาตามเวลา + เช็กอิน (Owner: Dev 1)

sweep_no_shows(conn, now)
    การจอง status='active' ที่เลย start + NO_SHOW_GRACE_MIN แล้วยังไม่เช็กอิน
    -> status='auto_cancelled', cancelled_at=now, คืนช่อง (trigger/availability ไม่นับแถวนี้แล้ว)
    -> เขียน notifications type='auto_cancelled' (ตารางเดียวกับ US3/US4 ของ Dev 4)
    เรียกแบบ lazy ที่ต้น request ที่อ่านรายการจอง/ช่อง (ไม่ต้องมี cron) ดู app.py

POST /api/reservations/<code>/check-in
    200 {ok:true, reservation:{code, status:'checked_in', checked_in_at}}
    404 NOT_FOUND · 409 NOT_ACTIVE (ยกเลิกไปแล้ว/เช็กอินแล้ว)
    422 NOT_IN_GRACE (เร็วเกินไป หรือเลยช่วง grace จนถูกยกเลิกอัตโนมัติ)
"""

from datetime import datetime, timedelta

from flask import Blueprint, jsonify

from auth import error_response
from config import CHECKIN_EARLY_MIN, NO_SHOW_GRACE_MIN


def _rollback(conn):
    if conn.in_transaction:
        conn.execute("ROLLBACK")


def _auto_cancel_message(label, start_at, end_at):
    return (
        f"การจองช่อง {label} เวลา {start_at:%H:%M}–{end_at:%H:%M} "
        f"ถูกยกเลิกอัตโนมัติ เนื่องจากไม่สแกน QR ภายใน {NO_SHOW_GRACE_MIN} นาทีหลังเวลาเริ่ม"
    )


def sweep_no_shows(conn, now, grace_min=NO_SHOW_GRACE_MIN):
    """ยกเลิกการจองที่ไม่มาตามเวลา คืนจำนวนรายการที่ถูกยกเลิก

    เปิด transaction เองถ้ายังไม่มี (ถ้าผู้เรียกเปิดไว้แล้ว จะทำงานใน transaction เดิม)
    """
    # ตัดรอบที่ระดับนาที: start_at เก็บเป็น 'YYYY-MM-DDTHH:MM' จึงหาแถวที่อาจหมดเวลาได้ด้วย SQL ก่อน
    # แล้วค่อยเทียบเวลาจริงใน Python ให้แม่น (start + grace < now)
    upper_bound = (now - timedelta(minutes=grace_min)).strftime("%Y-%m-%dT%H:%M")
    own_transaction = not conn.in_transaction
    try:
        if own_transaction:
            conn.execute("BEGIN IMMEDIATE")
        rows = conn.execute(
            """SELECT r.id, r.student_id, r.start_at, r.end_at, s.label
               FROM reservations AS r
               JOIN slots AS s ON s.id = r.slot_id
               WHERE r.status = 'active' AND r.start_at <= ?""",
            (upper_bound,),
        ).fetchall()

        cancelled_at = now.isoformat(timespec="seconds")
        cancelled = 0
        for row in rows:
            start_at = datetime.fromisoformat(row["start_at"])
            if not start_at + timedelta(minutes=grace_min) < now:
                continue
            updated = conn.execute(
                """UPDATE reservations
                   SET status = 'auto_cancelled', cancelled_at = ?
                   WHERE id = ? AND status = 'active'""",
                (cancelled_at, row["id"]),
            ).rowcount
            if not updated:
                continue
            cancelled += 1
            if row["student_id"]:  # การจองเก่าก่อน CORE-01 ไม่มีเจ้าของ จึงไม่มีคนรับแจ้งเตือน
                conn.execute(
                    """INSERT OR IGNORE INTO notifications
                           (student_id, reservation_id, type, message, created_at)
                       VALUES (?, ?, 'auto_cancelled', ?, ?)""",
                    (
                        row["student_id"],
                        row["id"],
                        _auto_cancel_message(
                            row["label"], start_at, datetime.fromisoformat(row["end_at"])
                        ),
                        cancelled_at,
                    ),
                )
        if own_transaction:
            conn.execute("COMMIT")
        return cancelled
    except BaseException:
        if own_transaction:
            _rollback(conn)
        raise


def check_in(conn, code, now, grace_min=NO_SHOW_GRACE_MIN, early_min=CHECKIN_EARLY_MIN):
    """เช็กอินการจอง คืน (body, http_status)"""
    try:
        conn.execute("BEGIN IMMEDIATE")
        # ยกเลิกรายการที่หมดเวลาก่อน เพื่อให้ผลของการเช็กอินสอดคล้องกับ sweep เสมอ
        sweep_no_shows(conn, now, grace_min)
        row = conn.execute(
            "SELECT id, code, status, start_at FROM reservations WHERE code = ?",
            (str(code).strip().upper(),),
        ).fetchone()
        if row is None:
            _rollback(conn)
            return error_response("NOT_FOUND", "ไม่พบรหัสการจองนี้", 404)

        if row["status"] == "auto_cancelled":
            conn.execute("COMMIT")  # เก็บผลของ sweep ไว้
            return error_response(
                "NOT_IN_GRACE",
                f"เลยเวลาเช็กอิน ({grace_min} นาทีหลังเวลาเริ่ม) การจองถูกยกเลิกอัตโนมัติแล้ว",
                422,
            )
        if row["status"] != "active":
            conn.execute("COMMIT")
            return error_response("NOT_ACTIVE", "การจองนี้ไม่อยู่ในสถานะที่เช็กอินได้", 409)

        start_at = datetime.fromisoformat(row["start_at"])
        opens_at = start_at - timedelta(minutes=early_min)
        if now < opens_at:
            conn.execute("COMMIT")
            return error_response(
                "NOT_IN_GRACE",
                f"ยังไม่ถึงเวลาเช็กอิน เช็กอินได้ตั้งแต่ {opens_at:%H:%M} น.",
                422,
            )

        checked_in_at = now.isoformat(timespec="seconds")
        conn.execute(
            "UPDATE reservations SET status = 'checked_in', checked_in_at = ? WHERE id = ?",
            (checked_in_at, row["id"]),
        )
        conn.execute("COMMIT")
        return jsonify({
            "ok": True,
            "reservation": {
                "code": row["code"],
                "status": "checked_in",
                "checked_in_at": checked_in_at,
            },
        }), 200
    except BaseException:
        _rollback(conn)
        raise


def register_routes(app, get_conn, now_func):
    blueprint = Blueprint("no_show", __name__)

    # ยังไม่บังคับล็อกอิน: ผู้เรียกคือด่านสแกน QR (เหมือน GET /api/reservations/<code>)
    # US14 (รปภ.) ควรเพิ่มสิทธิ์ผู้สแกนภายหลัง
    @blueprint.post("/api/reservations/<code>/check-in")
    def api_check_in(code):
        return check_in(get_conn(), code, now_func())

    app.register_blueprint(blueprint)