"""ลงทะเบียนรถ: ตรวจนักศึกษากับ TU REST API (tu_client.py) แล้วเก็บลง SQLite

สัญญา endpoint ตรงกับ frontend/js/api/vehicles.js
ถ้าไม่ได้ตั้ง TU_API_KEY จะใช้ข้อมูลจำลอง (รหัสลงท้าย 0000 = ไม่พบใน มธ.) เพื่อให้พัฒนา/เทสได้
"""

import re
from datetime import datetime

from booking_service import BookingError, normalize_plate

STUDENT_ID_RE = re.compile(r"^\d{10}$")
EMAIL_SUFFIX = "@dome.tu.ac.th"
FAKE_FACULTY = "คณะวิศวกรรมศาสตร์"


def _text(payload, key):
    value = payload.get(key) if isinstance(payload, dict) else None
    return value.strip() if isinstance(value, str) else ""


def verify_student(conn, payload, tu_client=None, now=None):
    """ตรวจรหัสนักศึกษา + อีเมล มธ. กับ TU แล้วบันทึกผลลงตาราง students"""
    student_id = _text(payload, "student_id")
    email = _text(payload, "email").lower()
    if not STUDENT_ID_RE.match(student_id):
        raise BookingError("VALIDATION_ERROR", "รหัสนักศึกษาต้องเป็นตัวเลข 10 หลัก", 400)
    if not email.endswith(EMAIL_SUFFIX) or len(email) <= len(EMAIL_SUFFIX):
        raise BookingError("VALIDATION_ERROR", f"อีเมลต้องลงท้ายด้วย {EMAIL_SUFFIX}", 400)

    if tu_client is None:
        if student_id.endswith("0000"):
            raise BookingError("TU_NOT_FOUND", "ไม่พบข้อมูลนักศึกษาในระบบ มธ. (Invalid user)", 404)
        info = {"name": f"นักศึกษา {student_id[-4:]}", "faculty": FAKE_FACULTY, "email": email}
    else:
        info = tu_client.get_student(student_id)
        if info["email"] and info["email"] != email:  # อีเมลไม่ตรงกับที่ มธ. มีอยู่
            raise BookingError("TU_NOT_FOUND", "ไม่พบข้อมูลนักศึกษาในระบบ มธ. (Invalid user)", 404)

    student = {
        "student_id": student_id,
        "name": info["name"],
        "faculty": info["faculty"],
        "email": email,
    }
    conn.execute(
        "INSERT INTO students (student_id, name, faculty, email, verified_at) "
        "VALUES (:student_id, :name, :faculty, :email, :verified_at) "
        "ON CONFLICT(student_id) DO UPDATE SET name = excluded.name, "
        "faculty = excluded.faculty, email = excluded.email, verified_at = excluded.verified_at",
        {**student, "verified_at": (now or datetime.now()).isoformat(timespec="seconds")},
    )
    return student


def save_vehicle(conn, payload, now=None):
    """บันทึกทะเบียนรถลง SQLite คืนรถที่บันทึก; นักศึกษาเดิมลงซ้ำ = แทนที่ข้อมูลเดิม (id คงเดิม)"""
    student_id = _text(payload, "student_id")
    vehicle_type = _text(payload, "vehicle_type") or "car"
    plate = _text(payload, "plate")
    province = _text(payload, "province")
    if not STUDENT_ID_RE.match(student_id):
        raise BookingError("VALIDATION_ERROR", "รหัสนักศึกษาต้องเป็นตัวเลข 10 หลัก", 400)
    if vehicle_type not in ("car", "motorcycle"):
        raise BookingError("VALIDATION_ERROR", "ประเภทรถต้องเป็น car หรือ motorcycle เท่านั้น", 400)
    if not plate or not province:
        raise BookingError("VALIDATION_ERROR", "กรุณากรอกทะเบียนรถและจังหวัด", 400)
    plate = normalize_plate(plate)
    _ensure_plate_not_taken(conn, plate, province, "student_id != ?", student_id)
    conn.execute(
        "INSERT INTO vehicles (student_id, plate, province, created_at) "
        "VALUES (?, ?, ?, ?) "
        "ON CONFLICT(student_id) DO UPDATE SET plate = excluded.plate, province = excluded.province",
        (student_id, plate, province, (now or datetime.now()).isoformat(timespec="seconds")),
    )
    row = conn.execute(
        "SELECT id, student_id, plate, province FROM vehicles WHERE student_id = ?",
        (student_id,),
    ).fetchone()
    return dict(row)


def _ensure_plate_not_taken(conn, plate, province, exclude_sql, exclude_value):
    """ทะเบียน+จังหวัดเดียวกันห้ามซ้ำกับรถของคนอื่น -> 409 PLATE_DUPLICATE"""
    duplicate = conn.execute(
        f"SELECT 1 FROM vehicles WHERE plate = ? AND province = ? AND {exclude_sql}",
        (plate, province, exclude_value),
    ).fetchone()
    if duplicate:
        raise BookingError("PLATE_DUPLICATE", "เลขทะเบียนนี้มีผู้ใช้งานอื่นลงทะเบียนแล้ว", 409)


def update_vehicle(conn, vehicle_id, payload, current_student_id=None, now=None):
    """อัปเดตข้อมูลทะเบียนรถ: ตรวจรูปแบบ, ห้ามซ้ำกับคนอื่น (409), และตรวจความเป็นเจ้าของ (403)"""
    plate = _text(payload, "plate")
    province = _text(payload, "province")

    if not plate or not province:
        raise BookingError("VALIDATION_ERROR", "กรุณากรอกทะเบียนรถและจังหวัด", 400)
    plate = normalize_plate(plate)  # รูปแบบทะเบียนเดียวกับตอนจอง/ลงทะเบียน (INVALID_PLATE 400)

    row = conn.execute(
        "SELECT id, student_id, plate, province FROM vehicles WHERE id = ?",
        (vehicle_id,),
    ).fetchone()

    if not row:
        raise BookingError("VEHICLE_NOT_FOUND", "ไม่พบข้อมูลรถในระบบ", 404)

    vehicle = dict(row)

    # ตรวจเจ้าของเสมอ (ไม่ส่ง student_id มา = ไม่ใช่เจ้าของ)
    if not current_student_id or vehicle["student_id"] != current_student_id:
        raise BookingError("FORBIDDEN", "คุณไม่ใช่เจ้าของรถคันนี้", 403)

    _ensure_plate_not_taken(conn, plate, province, "id != ?", vehicle_id)

    conn.execute(
        "UPDATE vehicles SET plate = ?, province = ? WHERE id = ?",
        (plate, province, vehicle_id),
    )

    updated_row = conn.execute(
        "SELECT id, student_id, plate, province FROM vehicles WHERE id = ?",
        (vehicle_id,),
    ).fetchone()

    return dict(updated_row)
