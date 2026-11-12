"""บริการจัดการข้อมูลสมาชิกและการลงทะเบียน (US2)"""

import re
from werkzeug.security import generate_password_hash
import vehicle_service

def validate_email(email):
    """ตรวจสอบรูปแบบอีเมลเบื้องต้น"""
    pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    return bool(re.match(pattern, email))

def validate_phone(phone):
    """ตรวจสอบรูปแบบเบอร์โทรศัพท์ (10 หลัก เริ่มต้นด้วย 0)"""
    pattern = r"^0\d{9}$"
    return bool(re.match(pattern, phone))

def register_member(conn, data, now_func):
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
        "SELECT student_id, name FROM students WHERE student_id = ?",
        (student_id,)
    ).fetchone()

    if not student_row:
        return {"ok": False, "error": {"code": "STUDENT_NOT_FOUND", "message": "ไม่พบรหัสประจำตัวนักศึกษาในระบบ กรุณาติดต่อเจ้าหน้าที่"}}, 404

    existing_account = conn.execute(
        "SELECT student_id FROM accounts WHERE student_id = ? OR email = ?",
        (student_id, email)
    ).fetchone()

    if existing_account:
        return {"ok": False, "error": {"code": "MEMBER_DUPLICATE", "message": "รหัสนักศึกษาหรืออีเมลนี้ถูกใช้งานลงทะเบียนแล้ว"}}, 409

    password_hash = generate_password_hash(password)

    try:
        # บันทึกข้อมูลลงตาราง accounts (US11)
        conn.execute(
            "INSERT INTO accounts (student_id, email, password_hash, phone, created_at) VALUES (?, ?, ?, ?, ?)",
            (student_id, email, password_hash, phone, now_func().isoformat(timespec="seconds"))
        )

        vehicle_payload = {
            "student_id": student_id,
            "vehicle_type": vehicle_type,
            "plate": plate,
            "province": province
        }
        
        # บันทึกข้อมูลรถ
        saved_vehicle = vehicle_service.save_vehicle(conn, vehicle_payload, now_func())
        
        # ยืนยันการบันทึกข้อมูลลงฐานข้อมูล
        conn.commit()

    except Exception as e:
        conn.rollback() # ยกเลิกการเปลี่ยนแปลงทั้งหมดหากเกิดข้อผิดพลาด
        raise e

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