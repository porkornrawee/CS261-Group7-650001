"""Cancellation endpoint and business logic for US3."""

from datetime import datetime, timedelta

from flask import Blueprint, g, jsonify

from auth import login_required
from config import CANCEL_DEADLINE_MIN


def register_routes(app, get_conn, now_func):
    """Register the authenticated reservation cancellation endpoint."""
    blueprint = Blueprint("cancel", __name__)

    @blueprint.post("/api/reservations/<code>/cancel")
    @login_required
    def cancel_reservation(code):
        conn = get_conn()
        try:
            # Keep the ownership/status/deadline checks and update atomic so a
            # reservation cannot change between validation and cancellation.
            conn.execute("BEGIN IMMEDIATE")
            reservation = conn.execute(
                """SELECT r.id, r.code, r.student_id, r.status, r.start_at,
                          r.end_at, s.label
                   FROM reservations AS r
                   JOIN slots AS s ON s.id = r.slot_id
                   WHERE r.code = ?""",
                (str(code).strip().upper(),),
            ).fetchone()

            if reservation is None:
                conn.execute("ROLLBACK")
                return jsonify({
                    "ok": False,
                    "error": {"code": "NOT_FOUND", "message": "ไม่พบรหัสการจองนี้"},
                }), 404

            if reservation["student_id"] != g.student_id:
                conn.execute("ROLLBACK")
                return jsonify({
                    "ok": False,
                    "error": {
                        "code": "FORBIDDEN",
                        "message": "คุณไม่มีสิทธิ์ยกเลิกการจองนี้",
                    },
                }), 403

            if reservation["status"] != "active":
                conn.execute("ROLLBACK")
                return jsonify({
                    "ok": False,
                    "error": {
                        "code": "NOT_CANCELLABLE",
                        "message": "การจองนี้ไม่สามารถยกเลิกได้",
                    },
                }), 409

            now = now_func()
            start_at = datetime.fromisoformat(reservation["start_at"])
            if now > start_at - timedelta(minutes=CANCEL_DEADLINE_MIN):
                conn.execute("ROLLBACK")
                return jsonify({
                    "ok": False,
                    "error": {
                        "code": "CANCEL_DEADLINE_PASSED",
                        "message": "เลยกำหนดยกเลิกการจองแล้ว",
                    },
                }), 422

            cancelled_at = now.isoformat(timespec="seconds")
            conn.execute(
                """UPDATE reservations
                   SET status = 'cancelled', cancelled_at = ?
                   WHERE id = ?""",
                (cancelled_at, reservation["id"]),
            )
            message = (
                f"การจองช่อง {reservation['label']} เวลา "
                f"{start_at:%H:%M}–"
                f"{datetime.fromisoformat(reservation['end_at']):%H:%M} "
                "ถูกยกเลิก"
            )
            conn.execute(
                """INSERT INTO notifications
                       (student_id, reservation_id, type, message, created_at)
                   VALUES (?, ?, 'cancelled', ?, ?)""",
                (g.student_id, reservation["id"], message, cancelled_at),
            )
            conn.execute("COMMIT")
            return jsonify({
                "ok": True,
                "reservation": {
                    "code": reservation["code"],
                    "status": "cancelled",
                    "cancelled_at": cancelled_at,
                },
            })
        except BaseException:
            if conn.in_transaction:
                conn.execute("ROLLBACK")
            raise

    app.register_blueprint(blueprint)
