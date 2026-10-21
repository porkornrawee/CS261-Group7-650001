# Dev 2 — เมย์ (Mars-128-8)

งาน: **US2** สมัครสมาชิกภายนอก · **US1** แก้ไขทะเบียนรถ · **#40** ต่อ UI จองเข้ากับ API จริง (ร่วม Dev 3) · ภาพรวมดู [README.md](README.md)
รีวิวงานของคุณโดย: Dev 1 · คุณรีวิวงานของ: Dev 4

ลำดับ: US1-edit (ต่อยอดของเดิมที่ Doing) → #40 → US2 · รอ CORE-01 เฉพาะส่วนที่ต้องมี `@login_required`

---
## US1 — หน้าแก้ไขทะเบียนรถ <a id="us1-edit"></a>
การ์ด Trello: `[FE/BE/QA] (US1) สร้างหน้าแก้ไข บันทึกข้อมูล และทดสอบการแก้ไขทะเบียนรถ` (อยู่ Doing)
**ต้องได้:** แก้ทะเบียน/จังหวัดของรถที่บันทึกไว้ได้, ตรวจรูปแบบทะเบียนไทย, ห้ามซ้ำกับของคนอื่น

| ส่วน | งาน | ไฟล์ |
|---|---|---|
| BE | `PUT /api/vehicles/<id>`: ตรวจรูปแบบ (ใช้กฎเดียวกับ `save_vehicle`), ทะเบียนซ้ำของคนอื่น → 409 `PLATE_DUPLICATE`, ไม่ใช่เจ้าของ → 403 (หลัง CORE-01) | `backend-python/vehicle_service.py` (`update_vehicle`), `app.py` |
| DB | `vehicles` มี `student_id UNIQUE` อยู่แล้ว — เพิ่ม unique บน `(plate, province)` (ถ้าชนกับข้อมูลเดิมให้ปรึกษาปอ) | `backend-python/db.py` |
| FE | ปุ่ม "แก้ไข" ที่ VehicleCard → เปิดฟอร์มเดิม (VehicleForm โหมด edit, ล็อกรหัส นศ.) → บันทึก → อัปเดตการ์ด; จัดการ loading/error | `frontend/js/features/vehicle/VehicleForm.js`, `VehicleCard.js`, `pages/VehiclePage.js`, `api/vehicles.js` (`updateVehicle`) + mock |
| Test | แก้สำเร็จ / รูปแบบผิด / ทะเบียนซ้ำ / แก้ของคนอื่น | `backend-python/tests/test_vehicle_edit.py`, `frontend/tests/` |

---
## #40 — ต่อหน้า UI จองเข้ากับ Backend API จริง (ร่วม Dev 3) <a id="fe-40"></a>
**ต้องได้:** ตัด mock data ออกจากหน้าจอง; ใช้ `GET /api/zones`, `/api/availability`, `POST /api/reservations` จริง; แสดง error 4 เคสถูกต้อง (ทะเบียนผิด, ช่องชน `SLOT_CONFLICT`, โซนเต็ม `ZONE_FULL`, นอกเวลา `OUTSIDE_HOURS`)
- ไฟล์: `frontend/js/pages/BookingPage.js`, `api/zones.js`, `api/reservations.js`, `api/client.js`
- แบ่งกับ Dev 3: Dev 2 ทำฝั่งดึงข้อมูล/ส่งจอง (`api/*.js`), Dev 3 ทำฝั่งแสดง error และผังช่อง — คุยกันก่อนเปิด PR กันแก้ไฟล์ชนกัน
- หลัง CORE-01: ส่ง session cookie (`credentials: 'same-origin'`) ใน `client.js` ให้ถูกต้อง

---
## US2 — ลงทะเบียนสมาชิกบุคคลภายนอก <a id="us2"></a>
**Story:** สมาชิกภายนอก (ไม่มีบัญชี มธ.) ลงทะเบียนพร้อมข้อมูลรถ (รถยนต์/มอเตอร์ไซค์) เพื่อใช้ระบบตามสิทธิ์ · ป้าย Trello: Sprint 2 + Sprint 3 (ยืนยันกับทีมว่าทำรอบนี้)
**AC (ร่างจากการ์ด — ให้เมย์ยืนยันกับทีมก่อนเริ่ม):** กรอกชื่อ-เบอร์โทร-อีเมล-ประเภทรถ-ทะเบียน; ตรวจรูปแบบ; ข้อมูลซ้ำถูกปฏิเสธ; บันทึกแล้วล็อกอินใช้งานได้

| ส่วน | งาน | ไฟล์ |
|---|---|---|
| DB | ตาราง `members(id, name, phone, email UNIQUE, member_type='external', created_at)`; `vehicles` เพิ่ม `vehicle_type` (`car|motorcycle`) และให้ผูกกับ member ได้ (เสนอ: ใช้ `student_id` เป็น key กลางโดยให้ member ได้ id แบบ `EXT-0001`) | `backend-python/db.py` |
| BE | `POST /api/members` (validate, ซ้ำ → 409 `MEMBER_DUPLICATE`), บันทึกรถผ่าน `save_vehicle`; ขอตั้งรหัสผ่านร่วมกับ US11 (`accounts`) | `backend-python/member_service.py` (ใหม่), `app.py` |
| FE | หน้า `#/register-external` + `MemberForm` + ลิงก์จากหน้า login/home | `frontend/js/pages/MemberRegisterPage.js`, `features/member/MemberForm.js`, `api/members.js` + mock, `router.js` |
| Test | บันทึกสำเร็จ / ข้อมูลไม่ครบ / ซ้ำ / ประเภทรถผิด | `backend-python/tests/test_members.py`, `frontend/tests/` |

ประสานกับ Dev 1: ตาราง `accounts` ของ US11 ต้องรองรับ member ภายนอกด้วย
