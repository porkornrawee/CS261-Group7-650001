"""Session-based identity helpers for authenticated API routes (CORE-01, Owner: Dev 1).

ใช้งาน:

    from auth import login_required, forbidden

    @app.get("/api/me/something")
    @login_required                      # ไม่ได้ล็อกอิน -> 401 UNAUTHORIZED
    def my_thing():
        row = ...
        if row["student_id"] != g.student_id:
            return forbidden()           # ของคนอื่น -> 403 FORBIDDEN
        ...

session["student_id"] ถูกตั้งโดย POST /api/auth/login (auth_service.py, US11)
"""

from functools import wraps

from flask import g, jsonify, session


def error_response(code, message, http_status):
    """รูปแบบ error เดียวกับทั้งระบบ: {ok:false, error:{code, message}}"""
    return jsonify({"ok": False, "error": {"code": code, "message": message}}), http_status


def unauthorized():
    return error_response("UNAUTHORIZED", "กรุณาเข้าสู่ระบบก่อนใช้งาน", 401)


def forbidden(message="คุณไม่มีสิทธิ์ดำเนินการนี้"):
    return error_response("FORBIDDEN", message, 403)


def student_from_session():
    """Bind the signed session's student ID to the current request context."""
    student_id = session.get("student_id")
    if student_id:
        g.student_id = str(student_id)
        return g.student_id
    g.pop("student_id", None)
    return None


def login_user(student_id):
    """เริ่ม session ใหม่ (ล้างของเดิมก่อน กัน session fixation)"""
    session.clear()
    session["student_id"] = str(student_id)
    session.permanent = True
    g.student_id = str(student_id)


def logout_user():
    session.clear()
    g.pop("student_id", None)


def login_required(view):
    """Require an authenticated session and set ``g.student_id``."""
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not student_from_session():
            return unauthorized()
        return view(*args, **kwargs)

    return wrapped