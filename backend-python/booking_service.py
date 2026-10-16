"""ตรรกะธุรกิจของการจองที่จอดรถ (US7)

ลำดับการตรวจใน create_reservation (หยุดที่ข้อแรกที่ไม่ผ่าน)
  1. ตรวจข้อมูลที่ส่งมา               -> VALIDATION_ERROR (400)
  2. ช่องจอดต้องมีอยู่จริง            -> SLOT_NOT_FOUND   (404)
  3. C04 ต้องอยู่ในเวลาเปิดทำการ      -> OUTSIDE_HOURS    (422)
  4. ต้องจองล่วงหน้า (ไม่ย้อนหลัง)     -> PAST_TIME        (422)
  --- จากนี้อยู่ใน transaction เดียว (BEGIN IMMEDIATE) เพื่อกันการจองพร้อมกัน ---
  5. C01 โซนเต็มในช่วงเวลานั้น         -> ZONE_FULL        (409)
  6. NFR02 ช่องนี้ถูกจองซ้อนเวลา       -> SLOT_CONFLICT    (409)
  7. บันทึกลงฐานข้อมูล แล้วคืนรหัสจอง
"""

import secrets
import sqlite3
from datetime import datetime, time

from config import (
    BOOKING_CODE_PREFIX,
    CLOSE_TIME,
    MAX_NAME_LENGTH,
    OPEN_TIME,
)

DATE_FORMAT = "%Y-%m-%d"
TIME_FORMAT = "%H:%M"
STORE_FORMAT = "%Y-%m-%dT%H:%M"

# ตัดตัวที่อ่านสับสน (0/O, 1/I) ออก เพื่อให้พิมพ์รหัสด้วยมือได้ถ้า QR สแกนไม่ติด
CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


class BookingError(Exception):
    """ข้อผิดพลาดที่ต้องการบอกผู้ใช้ พร้อมรหัสและ HTTP status"""

    def __init__(self, code, message, http_status):
        super().__init__(message)
        self.code = code
        self.message = message
        self.http_status = http_status


# ---------------------------------------------------------------------------
# ตรวจและแปลงข้อมูลนำเข้า
# ---------------------------------------------------------------------------

def parse_interval(date_text, start_text, end_text):
    """แปลงวันที่ + เวลาเริ่ม/สิ้นสุด เป็น datetime (วันเดียวกันเสมอ)"""
    try:
        day = datetime.strptime(date_text, DATE_FORMAT).date()
        start_time = datetime.strptime(start_text, TIME_FORMAT).time()
        end_time = datetime.strptime(end_text, TIME_FORMAT).time()
    except (TypeError, ValueError):
        raise BookingError(
            "VALIDATION_ERROR",
            "รูปแบบวันที่หรือเวลาไม่ถูกต้อง (วันที่ YYYY-MM-DD, เวลา HH:MM)",
            400,
        )
    start = datetime.combine(day, start_time)
    end = datetime.combine(day, end_time)
    if end <= start:
        raise BookingError(
            "VALIDATION_ERROR", "เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น", 400
        )
    return start, end


def _validate_payload(payload):
    if not isinstance(payload, dict):
        raise BookingError("VALIDATION_ERROR", "รูปแบบข้อมูลที่ส่งมาไม่ถูกต้อง", 400)

    user_name = payload.get("user_name")
    if not isinstance(user_name, str) or not user_name.strip():
        raise BookingError("VALIDATION_ERROR", "กรุณากรอกชื่อผู้จอง", 400)
    user_name = user_name.strip()
    if len(user_name) > MAX_NAME_LENGTH:
        raise BookingError(
            "VALIDATION_ERROR",
            f"ชื่อผู้จองต้องไม่เกิน {MAX_NAME_LENGTH} ตัวอักษร",
            400,
        )

    slot_id = payload.get("slot_id")
    if isinstance(slot_id, bool) or not isinstance(slot_id, int):
        raise BookingError("VALIDATION_ERROR", "กรุณาเลือกช่องจอด", 400)

    start, end = parse_interval(
        payload.get("date"), payload.get("start"), payload.get("end")
    )
    return user_name, slot_id, start, end


def _check_opening_hours(start, end):
    """C04: ทั้งเวลาเริ่มและเวลาสิ้นสุดต้องอยู่ในช่วงเปิดทำการ (ขอบเขตเท่ากันได้)"""
    open_time = time.fromisoformat(OPEN_TIME)
    close_time = time.fromisoformat(CLOSE_TIME)
    if start.time() < open_time or end.time() > close_time:
        raise BookingError(
            "OUTSIDE_HOURS",
            f"จองได้เฉพาะช่วงเวลาเปิดทำการ {OPEN_TIME}-{CLOSE_TIME} น.",
            422,
        )


# ---------------------------------------------------------------------------
# คำสั่ง SQL ที่ใช้ซ้ำ
# ---------------------------------------------------------------------------

def _free_slots_in_zone(conn, zone_id, start_at, end_at):
    """จำนวนช่องในโซนที่ยังว่างตลอดช่วงเวลา [start_at, end_at)"""
    return conn.execute(
        """
        SELECT COUNT(*) FROM slots s
        WHERE s.zone_id = ?
          AND NOT EXISTS (
              SELECT 1 FROM reservations r
              WHERE r.slot_id = s.id
                AND r.start_at < ? AND r.end_at > ?
          )
        """,
        (zone_id, end_at, start_at),
    ).fetchone()[0]


def _slot_is_booked(conn, slot_id, start_at, end_at):
    return (
        conn.execute(
            """
            SELECT 1 FROM reservations
            WHERE slot_id = ? AND start_at < ? AND end_at > ?
            """,
            (slot_id, end_at, start_at),
        ).fetchone()
        is not None
    )


def _new_code(conn):
    """สุ่มรหัสจอง (ซ้ำกับของเดิมไม่ได้) เรียกขณะถือล็อกเขียนอยู่แล้ว จึงเช็กแล้วใช้ได้เลย"""
    while True:
        code = BOOKING_CODE_PREFIX + "".join(
            secrets.choice(CODE_ALPHABET) for _ in range(8)
        )
        if conn.execute(
            "SELECT 1 FROM reservations WHERE code = ?", (code,)
        ).fetchone() is None:
            return code


def _reservation_to_dict(row):
    return {
        "id": row["id"],
        "code": row["code"],
        "user_name": row["user_name"],
        "slot_id": row["slot_id"],
        "slot": row["slot_label"],
        "zone": row["zone_name"],
        "date": row["start_at"][:10],
        "start": row["start_at"][11:16],
        "end": row["end_at"][11:16],
        "created_at": row["created_at"],
    }


_RESERVATION_SELECT = """
    SELECT r.id, r.code, r.user_name, r.slot_id, r.start_at, r.end_at,
           r.created_at, s.label AS slot_label, z.name AS zone_name
    FROM reservations r
    JOIN slots s ON s.id = r.slot_id
    JOIN zones z ON z.id = s.zone_id
"""


# ---------------------------------------------------------------------------
# งานหลัก: สร้างการจอง
# ---------------------------------------------------------------------------

def create_reservation(conn, payload, now):
    """ตรวจเงื่อนไขทั้งหมดแล้วบันทึกการจอง คืนค่าเป็น dict ของการจอง

    now = เวลาปัจจุบัน (ส่งเข้ามาเพื่อให้ทดสอบได้ตรงเวลา)
    """
    user_name, slot_id, start, end = _validate_payload(payload)

    slot = conn.execute(
        """
        SELECT s.id, s.label, s.zone_id, z.name AS zone_name
        FROM slots s JOIN zones z ON z.id = s.zone_id
        WHERE s.id = ?
        """,
        (slot_id,),
    ).fetchone()
    if slot is None:
        raise BookingError("SLOT_NOT_FOUND", "ไม่พบช่องจอดที่เลือก", 404)

    _check_opening_hours(start, end)  # C04

    if start < now:
        raise BookingError(
            "PAST_TIME", "ไม่สามารถจองย้อนหลังได้ กรุณาเลือกเวลาในอนาคต", 422
        )

    start_at = start.strftime(STORE_FORMAT)
    end_at = end.strftime(STORE_FORMAT)

    try:
        # ล็อกการเขียนก่อนตรวจ: คนที่มาพร้อมกันต้องรอคิว และจะเห็นผลการจองของคนก่อนหน้าเสมอ
        conn.execute("BEGIN IMMEDIATE")

        # C01: ทุกช่องในโซนถูกจองในช่วงเวลานี้หมดแล้ว = โซนเต็ม
        if _free_slots_in_zone(conn, slot["zone_id"], start_at, end_at) == 0:
            raise BookingError(
                "ZONE_FULL",
                f"{slot['zone_name']} เต็มในช่วงเวลาที่เลือก กรุณาเลือกโซนหรือเวลาอื่น",
                409,
            )

        # NFR02: ช่องที่เลือกถูกจองซ้อนเวลาแล้ว
        if _slot_is_booked(conn, slot_id, start_at, end_at):
            raise BookingError(
                "SLOT_CONFLICT",
                f"ช่อง {slot['label']} ถูกจองในช่วงเวลาที่ซ้อนกันแล้ว กรุณาเลือกช่องหรือเวลาอื่น",
                409,
            )

        code = _new_code(conn)
        cursor = conn.execute(
            """
            INSERT INTO reservations
                (code, slot_id, user_name, start_at, end_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                code,
                slot_id,
                user_name,
                start_at,
                end_at,
                now.isoformat(timespec="seconds"),
            ),
        )
        reservation_id = cursor.lastrowid
        conn.execute("COMMIT")
    except sqlite3.IntegrityError as error:
        # trigger ของฐานข้อมูลกันซ้อนเวลาอีกชั้น (ปกติไม่ถึงตรงนี้ เพราะตรวจด้านบนแล้ว)
        _rollback(conn)
        if "SLOT_CONFLICT" in str(error):
            raise BookingError(
                "SLOT_CONFLICT",
                f"ช่อง {slot['label']} ถูกจองในช่วงเวลาที่ซ้อนกันแล้ว กรุณาเลือกช่องหรือเวลาอื่น",
                409,
            )
        raise
    except sqlite3.OperationalError as error:
        _rollback(conn)
        if "locked" in str(error).lower():
            raise BookingError(
                "BUSY", "ระบบกำลังประมวลผลหลายรายการ กรุณาลองใหม่อีกครั้ง", 503
            )
        raise
    except BaseException:
        _rollback(conn)
        raise

    return get_reservation_by_id(conn, reservation_id)


def _rollback(conn):
    if conn.in_transaction:
        conn.execute("ROLLBACK")


# ---------------------------------------------------------------------------
# งานอ่านข้อมูล
# ---------------------------------------------------------------------------

def get_reservation_by_id(conn, reservation_id):
    row = conn.execute(
        _RESERVATION_SELECT + " WHERE r.id = ?", (reservation_id,)
    ).fetchone()
    return _reservation_to_dict(row) if row else None


def get_reservation_by_code(conn, code):
    row = conn.execute(
        _RESERVATION_SELECT + " WHERE r.code = ?", (str(code).strip().upper(),)
    ).fetchone()
    return _reservation_to_dict(row) if row else None


def list_reservations(conn, limit=20):
    rows = conn.execute(
        _RESERVATION_SELECT + " ORDER BY r.id DESC LIMIT ?", (limit,)
    ).fetchall()
    return [_reservation_to_dict(row) for row in rows]


def get_layout(conn):
    """ผังโซน/ช่องจอด และเวลาเปิดทำการ สำหรับวาดหน้าเลือกช่อง"""
    zones = []
    for zone in conn.execute("SELECT id, name FROM zones ORDER BY id").fetchall():
        slots = conn.execute(
            "SELECT id, label FROM slots WHERE zone_id = ? ORDER BY id", (zone["id"],)
        ).fetchall()
        zones.append(
            {
                "id": zone["id"],
                "name": zone["name"],
                "slots": [{"id": s["id"], "label": s["label"]} for s in slots],
            }
        )
    return {"open_time": OPEN_TIME, "close_time": CLOSE_TIME, "zones": zones}


def _slot_busy_ranges(conn, slot_id, start_at, end_at):
    """ช่วงที่ช่องนี้ถูกจองซ้อนกับช่วงที่ขอ (ตัดให้อยู่ในกรอบ [start_at, end_at) เรียงตามเวลา)"""
    rows = conn.execute(
        """
        SELECT start_at, end_at FROM reservations
        WHERE slot_id = ? AND start_at < ? AND end_at > ?
        ORDER BY start_at
        """,
        (slot_id, end_at, start_at),
    ).fetchall()
    return [(max(r["start_at"], start_at), min(r["end_at"], end_at)) for r in rows]


def _minutes_between(a, b):
    return int((datetime.strptime(b, STORE_FORMAT) - datetime.strptime(a, STORE_FORMAT)).total_seconds() // 60)


def get_availability(conn, date_text, start_text, end_text):
    """สถานะแต่ละช่อง/โซนในช่วงเวลาที่ระบุ (ใช้แสดงผลเท่านั้น ไม่ใช่ตัวตัดสินการจอง)

    แต่ละช่องมี
      booked = ถูกจองซ้อนช่วงที่ขออย่างน้อยบางส่วน (ฟิลด์เดิม คงไว้เพื่อความเข้ากันได้)
      status = "free"    ว่างตลอดช่วง
               "partial" ติดจองบางช่วง (ยังเหลือช่วงว่างให้จอง)
               "booked"  ถูกจองเต็มทั้งช่วงที่ขอ
      busy   = ช่วงเวลาที่ติดจอง เช่น [{"start": "09:00", "end": "09:30"}]
    """
    start, end = parse_interval(date_text, start_text, end_text)
    start_at = start.strftime(STORE_FORMAT)
    end_at = end.strftime(STORE_FORMAT)
    window_minutes = _minutes_between(start_at, end_at)

    slots, zones = [], []
    for zone in conn.execute("SELECT id FROM zones ORDER BY id").fetchall():
        rows = conn.execute(
            "SELECT id FROM slots WHERE zone_id = ? ORDER BY id", (zone["id"],)
        ).fetchall()
        free = 0
        for row in rows:
            busy = _slot_busy_ranges(conn, row["id"], start_at, end_at)
            booked = bool(busy)
            # การจองในช่องเดียวกันซ้อนกันไม่ได้ (trigger) จึงรวมนาทีที่ติดจองได้ตรง ๆ
            busy_minutes = sum(_minutes_between(a, b) for a, b in busy)
            if not booked:
                status = "free"
                free += 1
            elif busy_minutes >= window_minutes:
                status = "booked"
            else:
                status = "partial"
            slots.append(
                {
                    "id": row["id"],
                    "booked": booked,
                    "status": status,
                    "busy": [{"start": a[11:16], "end": b[11:16]} for a, b in busy],
                }
            )
        zones.append(
            {"id": zone["id"], "free": free, "total": len(rows), "full": free == 0}
        )
    return {"slots": slots, "zones": zones}
