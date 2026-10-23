"""Session-based identity helpers for authenticated API routes."""

from functools import wraps

from flask import g, jsonify, session


def student_from_session():
    """Bind the signed session's student ID to the current request context."""
    student_id = session.get("student_id")
    if student_id:
        g.student_id = str(student_id)
        return g.student_id
    g.pop("student_id", None)
    return None


def login_required(view):
    """Require an authenticated session and set ``g.student_id``."""
    @wraps(view)
    def wrapped(*args, **kwargs):
        student_id = student_from_session()
        if not student_id:
            return jsonify({
                "ok": False,
                "error": {
                    "code": "UNAUTHORIZED",
                    "message": "กรุณาเข้าสู่ระบบก่อนใช้งาน",
                },
            }), 401
        return view(*args, **kwargs)

    return wrapped
