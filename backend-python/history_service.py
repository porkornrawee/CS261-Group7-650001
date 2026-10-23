"""Reservation history queries scoped to the authenticated student."""

from datetime import datetime


HISTORY_STATUSES = {"completed", "cancelled", "auto_cancelled"}


def list_my_reservations(conn, student_id, status=None, now=None):
    """Return reservations owned by ``student_id``, optionally filtered by status.

    ``student_id`` must come from the authenticated request context, never from
    client query parameters. Active/checked-in rows whose end time is before
    ``now`` are presented as completed without mutating their stored status.
    """
    if not student_id:
        raise ValueError("student_id is required")
    if status not in (None, "", *HISTORY_STATUSES):
        raise ValueError("unsupported history status")

    now = now or datetime.now()
    rows = conn.execute(
        """
        SELECT r.id, r.code, r.start_at, r.end_at, r.status,
               s.label AS slot, z.name AS zone
        FROM reservations AS r
        JOIN slots AS s ON s.id = r.slot_id
        JOIN zones AS z ON z.id = s.zone_id
        WHERE r.student_id = ?
        ORDER BY r.start_at DESC, r.id DESC
        """,
        (student_id,),
    ).fetchall()

    results = []
    for row in rows:
        item = dict(row)
        effective_status = item["status"]
        if effective_status in ("active", "checked_in") and datetime.fromisoformat(
            item["end_at"]
        ) < now:
            effective_status = "completed"
        item["status"] = effective_status
        if status and effective_status != status:
            continue

        start_at = item["start_at"]
        end_at = item["end_at"]
        item.update(
            date=start_at[:10],
            start=start_at[11:16],
            end=end_at[11:16],
        )
        results.append(item)

    return results
