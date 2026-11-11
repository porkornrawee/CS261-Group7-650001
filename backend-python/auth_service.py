"""US11 — เข้าสู่ระบบด้วยบัญชี (Owner: Dev 1)

POST /api/auth/login   body {student_id, password}
     200 {ok:true, user:{student_id, name}}
     400 VALIDATION_ERROR   (ไม่ได้ส่ง JSON / ช่องว่าง)
     401 INVALID_CREDENTIALS (ข้อความเดียวกันไม่ว่าผิด username หรือ password)
POST /api/auth/logout  200 {ok:true}               (ล้าง session)
GET  /api/auth/me      200 {ok:true, user:{...}} | 401 UNAUTHORIZED
"""

from flask import Blueprint, g, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

from auth import error_response, login_required, login_user, logout_user

INVALID_MESSAGE = "รหัสนักศึกษาหรือรหัสผ่านไม่ถูกต้อง"

# ใช้เทียบเมื่อไม่พบบัญชี เพื่อให้เวลาตอบกลับใกล้เคียงกับกรณีรหัสผ่านผิด (ไม่บอกใบ้ว่ามีบัญชีนี้ไหม)
_DUMMY_HASH = generate_password_hash("not-a-real-password", method="pbkdf2:sha256")


def find_user(conn, student_id):
    row = conn.execute(
        """SELECT a.student_id, a.password_hash, s.name
           FROM accounts AS a
           LEFT JOIN students AS s ON s.student_id = a.student_id
           WHERE a.student_id = ?""",
        (student_id,),
    ).fetchone()
    return row


def authenticate(conn, student_id, password):
    """คืน dict ผู้ใช้เมื่อรหัสถูก หรือ None (ไม่แยกว่าผิดช่องไหน)"""
    row = find_user(conn, student_id)
    password_hash = row["password_hash"] if row else _DUMMY_HASH
    ok = check_password_hash(password_hash, password)
    if row is None or not ok:
        return None
    return {"student_id": row["student_id"], "name": row["name"]}


def register_routes(app, get_conn):
    blueprint = Blueprint("auth", __name__)

    @blueprint.post("/api/auth/login")
    def login():
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return error_response("VALIDATION_ERROR", "กรุณาส่งข้อมูลเป็น JSON", 400)
        student_id = str(payload.get("student_id") or "").strip()
        password = payload.get("password")
        if not student_id or not isinstance(password, str) or not password:
            return error_response("VALIDATION_ERROR", "กรุณากรอกรหัสนักศึกษาและรหัสผ่าน", 400)

        user = authenticate(get_conn(), student_id, password)
        if user is None:
            logout_user()
            return error_response("INVALID_CREDENTIALS", INVALID_MESSAGE, 401)

        login_user(user["student_id"])
        return jsonify({"ok": True, "user": user})

    @blueprint.post("/api/auth/logout")
    def logout():
        logout_user()
        return jsonify({"ok": True})

    @blueprint.get("/api/auth/me")
    @login_required
    def me():
        row = get_conn().execute(
            "SELECT student_id, name FROM students WHERE student_id = ?",
            (g.student_id,),
        ).fetchone()
        if row is None:
            # session ค้างของบัญชีที่ถูกลบไปแล้ว -> ถือว่าไม่ได้ล็อกอิน
            logout_user()
            return error_response("UNAUTHORIZED", "กรุณาเข้าสู่ระบบก่อนใช้งาน", 401)
        return jsonify({"ok": True, "user": {"student_id": row["student_id"], "name": row["name"]}})

    app.register_blueprint(blueprint)