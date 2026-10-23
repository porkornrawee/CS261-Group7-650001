"""ค่าตั้งต้นของระบบจองที่จอดรถ (US7)

ปรับค่าที่นี่ที่เดียว ทั้ง Backend, ข้อความ error และ UI จะอ่านค่าจากที่นี่
"""

# C04: จองได้เฉพาะช่วงเวลาเปิดทำการ (รูปแบบ HH:MM, เวลาท้องถิ่น)
# สมมติฐาน: โจทย์ไม่ได้ระบุเวลาเปิด-ปิด จึงตั้ง 08:00-20:00 ไว้ก่อน
OPEN_TIME = "08:00"
CLOSE_TIME = "20:00"

# Sprint 2 notification threshold, shared by near-start and near-expiry alerts.
NOTIFY_BEFORE_MIN = 15

# ข้อมูลโซนและช่องจอดตั้งต้น (แทนข้อมูลจาก US6 ในช่วง Sprint 1)
# โซน B มีแค่ 2 ช่อง เพื่อให้สาธิตกรณี "โซนเต็ม" ได้เร็ว
DEFAULT_ZONES = {
    "โซน A": ["A1", "A2", "A3", "A4"],
    "โซน B": ["B1", "B2"],
}

MAX_NAME_LENGTH = 100
BOOKING_CODE_PREFIX = "PK-"

# Sprint 2 session and reservation lifecycle thresholds.
CANCEL_DEADLINE_MIN = 30
NO_SHOW_GRACE_MIN = 15
