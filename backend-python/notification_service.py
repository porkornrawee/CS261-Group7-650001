"""Generate reservation notifications when a request checks due events."""

from datetime import datetime, timedelta

from config import NOTIFY_BEFORE_MIN


def _as_datetime(value):
    """Parse the local ISO datetime strings stored by the reservation service."""
    return datetime.fromisoformat(value)


def _already_created(conn, reservation_id, notification_type):
    return conn.execute(
        """
        SELECT 1 FROM notifications
        WHERE reservation_id = ? AND type = ?
        LIMIT 1
        """,
        (reservation_id, notification_type),
    ).fetchone() is not None


def _insert_notification(conn, reservation, notification_type, message, now):
    if _already_created(conn, reservation["id"], notification_type):
        return 0

    cursor = conn.execute(
        """
        INSERT OR IGNORE INTO notifications
            (student_id, reservation_id, type, message, created_at, read_at)
        VALUES (?, ?, ?, ?, ?, NULL)
        """,
        (
            reservation["student_id"],
            reservation["id"],
            notification_type,
            message,
            now.isoformat(timespec="seconds"),
        ),
    )
    return cursor.rowcount


def generate_due_notifications(conn, now):
    """Create due notifications and return the number of rows inserted.

    Expects the CORE-01 schema: reservations have ``student_id``, ``status``,
    ``start_at`` and ``end_at``; notifications has a unique constraint on
    ``(reservation_id, type)``. Call this lazily alongside reservation sweeps.
    """
    threshold = NOTIFY_BEFORE_MIN
    reservations = conn.execute(
        """
        SELECT r.id, r.student_id, r.status, r.start_at, r.end_at, s.label
        FROM reservations AS r
        JOIN slots AS s ON s.id = r.slot_id
        ORDER BY r.id
        """
    ).fetchall()

    created = 0
    for reservation in reservations:
        # Legacy bookings are retained without an owner during the CORE-01 migration.
        if not reservation["student_id"]:
            continue
        status = reservation["status"]
        label = reservation["label"]

        if status in ("cancelled", "auto_cancelled"):
            notification_type = status
            start_at = _as_datetime(reservation["start_at"])
            end_at = _as_datetime(reservation["end_at"])
            message = (
                f"การจองช่อง {label} เวลา {start_at:%H:%M}–{end_at:%H:%M} "
                "ถูกยกเลิก"
            )
            created += _insert_notification(
                conn, reservation, notification_type, message, now
            )
            continue

        if status not in ("active", "checked_in"):
            continue

        start_at = _as_datetime(reservation["start_at"])
        end_at = _as_datetime(reservation["end_at"])
        if start_at - timedelta(minutes=threshold) <= now < start_at:
            message = f"การจองช่อง {label} จะเริ่มเวลา {start_at:%H:%M}"
            created += _insert_notification(
                conn, reservation, "near_start", message, now
            )

        if end_at - timedelta(minutes=threshold) <= now < end_at:
            message = f"การจองช่อง {label} ใกล้หมดเวลา {end_at:%H:%M}"
            created += _insert_notification(
                conn, reservation, "near_expiry", message, now
            )

    return created
