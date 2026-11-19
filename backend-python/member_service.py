"""บริการจัดการข้อมูลสมาชิกและการลงทะเบียน (US2)"""

import re
from werkzeug.security import generate_password_hash
import vehicle_service
from booking_service import BookingError

def validate_email(email):
    """ตรวจสอบรูปแบบอีเมลเบื้องต้น"""
    pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    return bool(re.match(pattern, email))

def validate_phone(phone):
    """ตรวจสอบรูปแบบเบอร์โทรศัพท์ (10 หลัก เริ่มต้นด้วย 0)"""
    pattern = r"^0\d{9}$"
    return bool(re.match(pattern, phone))

def _is_tu_member(tu_client, student_id):
    """มธ. มีรหัสนี้หรือไม่ (ไม่ได้ตั้ง TU_API_KEY = เช็กไม่ได้ จึงพึ่งเงื่อนไข verified_at อย่างเดียว)"""
    if tu_client is None:
        return False
    try:
        tu_client.get_student(student_id)
    except BookingError as error:
        if error.code == "TU_NOT_FOUND":
            return False
        raise  # TU_UNAVAILABLE: ปิดประตูไว้ก่อน ไม่ปล่อยให้สมัครผ่านไปโดยไม่ได้ตรวจ
    return True


def register_member(conn, data, now_func, tu_client=None):
    """
    ตรวจสอบข้อมูลและบันทึกสมาชิกลงตาราง students, accounts และ vehicles
    """
    if not data:
        return {"ok": False, "error": {"code": "VALIDATION_ERROR", "message": "ไม่พบข้อมูลสำหรับลงทะเบียน"}}, 400

    student_id = str(data.get("student_id", "")).strip()
    name = data.get("name")
    phone = data.get("phone")
    email = data.get("email")
    password = data.get("password")
    vehicle_type = data.get("vehicle_type")
    plate = data.get("plate")
    province = data.get("province")

    if not all([student_id, name, phone, email, password, vehicle_type, plate, province]):
        return {"ok": False, "error": {"code": "VALIDATION_ERROR", "message": "กรุณากรอกข้อมูลให้ครบถ้วน"}}, 400

    if len(password) < 8:
        return {"ok": False, "error": {"code": "VALIDATION_ERROR", "message": "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร"}}, 400

    if not validate_email(email):
        return {"ok": False, "error": {"code": "VALIDATION_ERROR", "message": "รูปแบบอีเมลไม่ถูกต้อง"}}, 400

    if not validate_phone(phone):
        return {"ok": False, "error": {"code": "VALIDATION_ERROR", "message": "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (ต้องเป็นตัวเลข 10 หลักขึ้นต้นด้วย 0)"}}, 400

    if vehicle_type not in ("car", "motorcycle"):
        return {"ok": False, "error": {"code": "VALIDATION_ERROR", "message": "ประเภทรถต้องเป็น car หรือ motorcycle เท่านั้น"}}, 400

    student_row = conn.execute(
        "SELECT student_id, name, verified_at FROM students WHERE student_id = ?",
        (student_id,)
    ).fetchone()

    if not student_row:
        # ไม่มีรหัสนี้ในระบบ = สมาชิกใหม่ สร้างแถวนักศึกษาจากรหัสที่กรอก (ไม่ต้องมีรายชื่อล่วงหน้า)
        # ถ้า มธ. มีรหัสนี้อยู่จริง ให้ไปล็อกอินด้วยบัญชี มธ. แทน (กัน account takeover)
        if _is_tu_member(tu_client, student_id):
            return {"ok": False, "error": {"code": "USE_TU_LOGIN", "message": "รหัสนี้เป็นของนักศึกษา/บุคลากร มธ. กรุณาเข้าสู่ระบบด้วยบัญชี มธ. แทนการสมัครสมาชิก"}}, 409
        conn.execute("INSERT INTO students (student_id, name) VALUES (?, ?)", (student_id, name))
        student_row = {"verified_at": None}

    # รหัสของนักศึกษา/บุคลากร มธ. ต้องเข้าด้วยบัญชี มธ. เท่านั้น: ห้ามคนอื่นสมัครสมาชิกด้วยรหัสนี้แล้วตั้งรหัสผ่านเอง
    # (กัน account takeover) -> ปฏิเสธถ้าเคยยืนยันกับ มธ. แล้ว หรือ มธ. มีรหัสนี้อยู่จริง
    if student_row["verified_at"] or _is_tu_member(tu_client, student_id):
        return {"ok": False, "error": {"code": "USE_TU_LOGIN", "message": "รหัสนี้เป็นของนักศึกษา/บุคลากร มธ. กรุณาเข้าสู่ระบบด้วยบัญชี มธ. แทนการสมัครสมาชิก"}}, 409

    existing_account = conn.execute(
        "SELECT student_id FROM accounts WHERE student_id = ? OR email = ?",
        (student_id, email)
    ).fetchone()

    if existing_account:
        return {"ok": False, "error": {"code": "MEMBER_DUPLICATE", "message": "รหัสนักศึกษาหรืออีเมลนี้ถูกใช้งานลงทะเบียนแล้ว"}}, 409

    password_hash = generate_password_hash(password)

    # การ commit/rollback ทำที่ route (app.py) เพื่อให้ account + vehicle อยู่ใน transaction เดียวกัน
    conn.execute(
        "INSERT INTO accounts (student_id, email, password_hash, phone, created_at) VALUES (?, ?, ?, ?, ?)",
        (student_id, email, password_hash, phone, now_func().isoformat(timespec="seconds")),
    )
    saved_vehicle = vehicle_service.save_vehicle(
        conn,
        {"student_id": student_id, "vehicle_type": vehicle_type, "plate": plate, "province": province},
        now_func(),
    )

    response_data = {
        "ok": True,
        "member": {
            "student_id": student_id,
            "name": name,
            "email": email,
            "phone": phone
        },
        "vehicle": saved_vehicle
    }

    return response_data, 201