"""ลงทะเบียนรถ (stub): ตอบข้อมูลจำลองให้หน้าเว็บใช้งานได้ ยังไม่เรียก TU REST API จริง

สัญญา endpoint ตรงกับ frontend/js/api/vehicles.js
เก็บทะเบียนรถไว้ในหน่วยความจำ (หายเมื่อรีสตาร์ท) จนกว่าจะมีตารางจริง
"""

import re

from booking_service import BookingError

STUDENT_ID_RE = re.compile(r"^\d{10}$")
EMAIL_SUFFIX = "@dome.tu.ac.th"
FAKE_FACULTY = "คณะวิศวกรรมศาสตร์"


def _text(payload, key):
    value = payload.get(key) if isinstance(payload, dict) else None
    return value.strip() if isinstance(value, str) else ""


def verify_student(payload):
    """ตรวจรหัสนักศึกษา + อีเมล มธ. (จำลอง: รหัสลงท้าย 0000 = ไม่พบใน มธ.)"""
    student_id = _text(payload, "student_id")
    email = _text(payload, "email").lower()
    if not STUDENT_ID_RE.match(student_id):
        raise BookingError("VALIDATION_ERROR", "รหัสนักศึกษาต้องเป็นตัวเลข 10 หลัก", 400)
    if not email.endswith(EMAIL_SUFFIX) or len(email) <= len(EMAIL_SUFFIX):
        raise BookingError("VALIDATION_ERROR", f"อีเมลต้องลงท้ายด้วย {EMAIL_SUFFIX}", 400)
    if student_id.endswith("0000"):
        raise BookingError("TU_NOT_FOUND", "ไม่พบข้อมูลนักศึกษาในระบบ มธ. (Invalid user)", 404)
    return {
        "student_id": student_id,
        "name": f"นักศึกษา {student_id[-4:]}",
        "faculty": FAKE_FACULTY,
        "email": email,
    }


def save_vehicle(store, payload):
    """บันทึกทะเบียนรถลง store (dict) คืนรถที่บันทึก; รหัสเดิมลงซ้ำ = แทนที่ข้อมูลเดิม"""
    student_id = _text(payload, "student_id")
    plate = _text(payload, "plate")
    province = _text(payload, "province")
    if not STUDENT_ID_RE.match(student_id):
        raise BookingError("VALIDATION_ERROR", "รหัสนักศึกษาต้องเป็นตัวเลข 10 หลัก", 400)
    if not plate or not province:
        raise BookingError("VALIDATION_ERROR", "กรุณากรอกทะเบียนรถและจังหวัด", 400)
    vehicle = store.get(student_id)
    vehicle_id = vehicle["id"] if vehicle else len(store) + 1
    vehicle = {"id": vehicle_id, "student_id": student_id, "plate": plate, "province": province}
    store[student_id] = vehicle
    return vehicle
