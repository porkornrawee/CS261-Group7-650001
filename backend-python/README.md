# ระบบจองที่จอดรถ — US7 (Sprint 1)

Working Software สำหรับวัน Demo: **UI กดจองได้จริง → Backend ตรวจเงื่อนไขจริง → บันทึกลงฐานข้อมูลจริง → ได้ QR Code จริง** พร้อม Automated Test ครบทั้ง 4 เคส

เทคโนโลยี: Python + Flask (Backend/API), SQLite (ฐานข้อมูล, เป็นไฟล์ `parking.db` ไม่ต้องติดตั้งเซิร์ฟเวอร์), HTML/CSS/JS ล้วน (UI), reportlab + Pillow (สร้าง QR)

## เริ่มใช้งาน

```bash
pip install -r requirements.txt
python app.py
```

เปิด <http://127.0.0.1:5000> (เปลี่ยนพอร์ตได้ด้วย `PORT=8000 python app.py`)

ต้องการเริ่มข้อมูลใหม่ทั้งหมด: หยุดเซิร์ฟเวอร์ แล้วลบไฟล์ `parking.db*` ระบบจะสร้างใหม่พร้อมโซน/ช่องจอดตั้งต้นให้เอง

## รัน Automated Test

```bash
python -m unittest discover -s tests -v
```

ไม่ต้องติดตั้งอะไรเพิ่ม (ถ้ามี pytest ใช้ `python -m pytest tests -v` ได้เช่นกัน) แต่ละเทสสร้างฐานข้อมูลชั่วคราวของตัวเอง ไม่แตะ `parking.db`

เทสที่ถอดรหัสภาพ QR กลับมาพิสูจน์ว่าสแกนได้จริง ต้องมี OpenCV: `pip install opencv-python-headless` (ถ้าไม่มี เทสข้อนั้นจะถูกข้ามและรายงานว่า skipped)

## สคริปต์สาธิตวัน Demo

หน้าจอตั้งต้นเป็น "พรุ่งนี้ 09:00–10:00" ซึ่งอยู่ในเวลาเปิดทำการเสมอ

| ขั้น | ทำอะไร | ผลที่ต้องเห็น |
|---|---|---|
| **TC-US7-01** | กรอกชื่อ เลือกช่อง **A1** กด "ยืนยันการจอง" | ได้บัตรจองพร้อม QR และรหัส `PK-XXXXXXXX` ทันที รายการปรากฏในตาราง "รายการจองล่าสุด" สแกน QR ด้วยมือถือจะได้ข้อความรหัสเดียวกัน |
| พิสูจน์ว่าลงฐานข้อมูลจริง | `python -c "import sqlite3;print(*sqlite3.connect('parking.db').execute('select code,slot_id,user_name,start_at,end_at from reservations'),sep='\n')"` | เห็นแถวที่เพิ่งจอง |
| **TC-US7-02** | กด "ยืนยันการจอง" ซ้ำที่ **A1** เวลาเดิม | "ช่องนี้ถูกจองแล้ว" (`SLOT_CONFLICT`) ช่อง A1 ในผังขึ้นลายขีดเฉียง |
| TC-US7-02 (2 คนพร้อมกัน) | รัน `python -m unittest discover -s tests -v -k two_users` | 2 คนยิงพร้อมกัน 15 รอบ สำเร็จ 1 ล้มเหลว 1 ทุกรอบ |
| **TC-US7-03** | จอง **B1** แล้วจอง **B2** (เวลาเดียวกัน) หัวโซน B ขึ้น "เต็ม" จากนั้นเลือก B1 อีกครั้งแล้วยืนยัน | "โซนเต็ม" (`ZONE_FULL`) |
| **TC-US7-04** | เปลี่ยนเวลาเป็น **07:00–08:00** แล้วยืนยัน | "อยู่นอกเวลาเปิดทำการ" (`OUTSIDE_HOURS`) |

สีของช่องจอดบนหน้าเว็บ: 🟩 เขียว = ว่าง · 🟨 เหลือง = ติดจองบางช่วงของเวลาที่เลือก (ลองเลื่อนเวลา) · 🟥 แดง = ไม่ว่างเต็มช่วง · วงสีน้ำเงิน = ช่องที่เลือก

หมายเหตุ: ช่องที่ถูกจองแล้วยัง **กดเลือกได้โดยตั้งใจ** เพื่อให้เห็นว่าผู้ตัดสินคือ Backend ไม่ใช่แค่หน้าจอ เคล็ดลับ: เปิด 2 แท็บ โหลดหน้าทิ้งไว้ทั้งคู่ แล้วจองช่องเดียวกันทีละแท็บ แท็บหลังจะถูกปฏิเสธทั้งที่หน้าจอยังแสดงว่าว่าง

## โยง Acceptance Criteria → โค้ด → เทส

| AC | กฎ | อยู่ที่ไหน | เทส |
|---|---|---|---|
| เลือกวัน/เวลา/ช่อง → ยืนยัน → ได้ QR | UC01, UC04 | `booking_service.create_reservation`, `qr_service.make_qr_png`, `static/index.html` | `TestUS7_01_BookingSucceeds` |
| ช่องที่ถูกจองช่วงเวลาซ้อนจองซ้ำไม่ได้ | NFR02 | ล็อกเขียน `BEGIN IMMEDIATE` ใน service + `TRIGGER` ใน `db.py` | `TestUS7_02_NoDoubleBooking` |
| ช่อง/โซนเต็มต้องไม่ให้จอง | C01 | `_free_slots_in_zone` | `TestUS7_03_ZoneFull` |
| จองได้เฉพาะช่วงเวลาเปิดทำการ | C04 | `_check_opening_hours`, ค่าใน `config.py` | `TestUS7_04_OutsideOpeningHours` |

**การจองพร้อมกัน (NFR02) ป้องกัน 2 ชั้น:** (1) ทุกการจองเปิด transaction แบบ `BEGIN IMMEDIATE` เพื่อล็อกการเขียนก่อนตรวจ คนที่มาพร้อมกันจึงต้องต่อคิวและเห็นผลของคนก่อนหน้าเสมอ (2) ฐานข้อมูลมี `TRIGGER` ปฏิเสธช่วงเวลาซ้อนกันในช่องเดียวกันเป็นด่านสุดท้าย ต่อให้โค้ดชั้นบนพลาด

ลำดับการตรวจ: ข้อมูลครบ → ช่องมีจริง → เวลาเปิดทำการ → ไม่ย้อนหลัง → โซนเต็ม → ช่องซ้อนเวลา → บันทึก

## API

| เมธอด | เส้นทาง | หน้าที่ |
|---|---|---|
| GET | `/api/zones` | ผังโซน/ช่องจอด และเวลาเปิดทำการ |
| GET | `/api/availability?date=&start=&end=` | สถานะของแต่ละช่องในช่วงเวลานั้น (ใช้แสดงผลเท่านั้น) แต่ละช่องมี `booked` (เดิม), `status` = `free` ว่าง / `partial` ติดจองบางช่วง / `booked` ไม่ว่างเต็มช่วง และ `busy` = รายการช่วงเวลาที่ติดจอง |
| POST | `/api/reservations` | จอง: ส่ง `user_name, slot_id, date (YYYY-MM-DD), start, end (HH:MM)` สำเร็จคืน 201 พร้อม `qr_data_uri` |
| GET | `/api/reservations` | รายการจองล่าสุด |
| GET | `/api/me/reservations?status=` | ประวัติของผู้ใช้ที่ล็อกอิน (`g.student_id` จาก session เท่านั้น); `status` เลือก `completed`, `cancelled` หรือ `auto_cancelled` ได้ |
| GET | `/api/me/notifications` | สร้างการแจ้งเตือนที่ถึงกำหนดแบบ lazy และคืนเฉพาะของผู้ใช้ที่ล็อกอิน พร้อม `unread_count` |
| POST | `/api/me/notifications/<id>/read` | ทำเครื่องหมายว่าอ่านแล้ว; เข้าถึงแจ้งเตือนของคนอื่นได้ `403 FORBIDDEN` |
| GET | `/api/reservations/<code>` | ค้นการจองจากรหัส (ด่านสแกน QR) คืนข้อมูลรวม `status` และ `cancelled_at` |
| POST | `/api/reservations/<code>/cancel` | ยกเลิกการจองของผู้ใช้ที่ล็อกอิน (ก่อนเริ่ม >= 30 นาที) คืนสถานะ `cancelled` และปล่อยช่องจอดทันที |
| GET | `/api/reservations/<code>/qr.png` | ภาพ QR |

สำหรับ API ที่ใช้ session ให้ตั้ง environment variable `FLASK_SECRET_KEY` เป็น secret ที่คงที่ก่อนเริ่ม Flask. `auth.login_required` อ่าน `student_id` จาก signed session แล้วตั้งค่า `g.student_id`; ระบบ login ที่สร้าง session อยู่ในขอบเขต US11.

รหัสข้อผิดพลาด: `VALIDATION_ERROR` 400 · `UNAUTHORIZED` 401 · `FORBIDDEN` 403 · `SLOT_NOT_FOUND` 404 · `NOT_CANCELLABLE` 409 · `ZONE_FULL` 409 · `SLOT_CONFLICT` 409 · `CANCEL_DEADLINE_PASSED` 422 · `OUTSIDE_HOURS` 422 · `PAST_TIME` 422 · `BUSY` 503

`GET /api/me/reservations` คืน `{ "ok": true, "reservations": [...] }`, `401 UNAUTHORIZED` หากไม่มี session และ `400 VALIDATION_ERROR` หากส่งสถานะอื่นที่ไม่รองรับ ตัวกรอง `student_id` ใน query string จะไม่มีผล

`GET /api/me/notifications` คืน `{ "ok": true, "notifications": [...], "unread_count": 0 }`; `POST /api/me/notifications/<id>/read` คืน `{ "ok": true, "notification": {...} }` หากไม่พบ ID ได้ `404 NOT_FOUND`. ทั้งสองเส้นทางใช้ session ผ่าน `@login_required`; ตั้งค่า `FLASK_SECRET_KEY` ก่อนเปิดใช้งาน session. `init_db()` เพิ่ม CORE-01 columns และ notifications table แบบ idempotent และเก็บรายการจองเดิมไว้.

`POST /api/reservations/<code>/cancel` คืน `{ "ok": true, "reservation": { "code": ..., "status": "cancelled", "cancelled_at": ... } }`. ต้องยืนยันตัวตนผ่าน `@login_required` (หากไม่มี session ได้ `401 UNAUTHORIZED`, ไม่ใช่เจ้าของได้ `403 FORBIDDEN`, ไม่พบรหัสได้ `404 NOT_FOUND`, สถานะไม่ใช่ active ได้ `409 NOT_CANCELLABLE`, เลยเส้นตายก่อนเริ่ม 30 นาที ได้ `422 CANCEL_DEADLINE_PASSED`). เมื่อยกเลิกสำเร็จ ระบบจะบันทึกแจ้งเตือนลงตาราง `notifications` (ประเภท `cancelled`) และ trigger จะปล่อยช่องจอดให้ผู้อื่นสามารถจองต่อได้ทันที.

## สมมติฐานที่ผมตัดสินใจเอง (ควรยืนยันกับทีม/อาจารย์)

1. **เวลาเปิดทำการ 08:00–20:00** โจทย์ไม่ได้ระบุ เปลี่ยนได้ที่ `config.py` ที่เดียว
2. **US6 และ US11 (Depends)** ไม่ได้ระบุเนื้อหา จึงทำแบบง่ายแทน: โซน/ช่องจอดมาจากข้อมูลตั้งต้นใน `config.py` (โซน A 4 ช่อง, โซน B 2 ช่อง) และผู้ใช้ระบุด้วยการกรอกชื่อ ไม่มีระบบล็อกอิน
3. **กฎ "ไม่จองย้อนหลัง" (`PAST_TIME`)** ผมเพิ่มเอง เพราะเป็นการจองล่วงหน้า ไม่อยู่ใน AC ถ้าไม่ต้องการ ลบการตรวจนี้ใน `create_reservation` ได้
4. **โซนเต็ม** = ทุกช่องในโซนถูกจองทับช่วงเวลาที่ขอ และตรวจก่อน "ช่องซ้อนเวลา" (ถ้าโซนเต็มจะได้ `ZONE_FULL` ไม่ใช่ `SLOT_CONFLICT`)
5. **ช่วงเวลาที่ต่อกันพอดี** (เช่น 10:00–11:00 กับ 11:00–12:00) จองได้ ไม่ถือว่าซ้อน
6. **QR เข้ารหัสรหัสการจอง** (`PK-XXXXXXXX`) ด่านทางเข้านำรหัสไปค้นที่ `/api/reservations/<code>`
7. SQLite เหมาะกับการสาธิต ถ้าขึ้นระบบจริงควรย้ายไป PostgreSQL และใช้ exclusion constraint แทน trigger

## โครงสร้างไฟล์

```
app.py               เว็บแอป + API (Flask)
booking_service.py   กฎธุรกิจทั้งหมด (C01, C04, NFR02) และการบันทึกแบบอะตอมมิก
db.py                โครงสร้างตาราง, trigger กันจองซ้อน, ข้อมูลตั้งต้น
qr_service.py        สร้างภาพ QR
config.py            เวลาเปิด-ปิด, รายการโซน/ช่อง
static/                index.html (โครง HTML) + css/ (8 ไฟล์ตามส่วนของหน้า) + js/ (9 ไฟล์ โหลดตามลำดับใน index.html)
tests/               Automated Test แยกไฟล์ละ TC (test_tc01..04) + us7_support.py (ตัวช่วยร่วม)
```
