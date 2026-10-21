# Dev 1 — ไอซ์ (TayadaDeesakul)

งาน: **CORE-01** → **US11** → **US12** · ภาพรวม/สัญญากลางดู [README.md](README.md)
รีวิวงานของคุณโดย: Dev 3 · คุณรีวิวงานของ: Dev 2

ลำดับ: CORE-01 (ทุกคนรอ!) → US11 → US12

---
## CORE-01 — สัญญากลาง (แทนการ์ด Spring Boot) <a id="core-01"></a>
รายละเอียดสัญญาทั้งหมดอยู่ใน [README.md](README.md#core-01--สัญญากลางที่ทุกคนต้องใช้ร่วมกัน-dev-1-ทำ)

| ส่วน | งาน | ไฟล์ |
|---|---|---|
| DB | เพิ่มคอลัมน์ `student_id,status,cancelled_at,checked_in_at` ใน `reservations`, ตาราง `notifications`, แก้ trigger ให้ไม่นับแถวที่ยกเลิก (migration แบบ idempotent เพราะ DB เดิมมีอยู่แล้ว) | `backend-python/db.py` |
| BE | ค่า config `CANCEL_DEADLINE_MIN / NOTIFY_BEFORE_MIN / NO_SHOW_GRACE_MIN` | `backend-python/config.py` |
| BE | `auth.py`: `@login_required`, `g.student_id`, 401/403 | `backend-python/auth.py` (สร้างใหม่) |
| BE | `create_reservation` รับ `student_id` จาก session และบันทึกลงตาราง | `backend-python/booking_service.py`, `app.py` |
| FE | เพิ่มข้อความ error ใหม่ 6 code | `frontend/js/api/errors.js` (+ test ใน `frontend/tests/errors.test.mjs`) |
| Test | trigger ไม่นับแถวที่ cancelled, migration รันซ้ำได้, 401 เมื่อไม่ล็อกอิน | `backend-python/tests/test_core_schema.py` |

**ต้องรอ:** merge `be/feat-tu-api-sqlite` ของปอก่อน (มีตาราง `students`) — ถามปอถ้ายังไม่ merge
**Definition of Done:** merge เข้า master, แจ้ง Dev 2–4 ในกลุ่ม, README มีตัวอย่างการใช้ `@login_required`

---
## US11 — เข้าสู่ระบบด้วยบัญชี reg <a id="us11"></a>
**Story:** ในฐานะนักศึกษา/บุคลากร มธ. ต้องการล็อกอินด้วยบัญชีที่ลงทะเบียนไว้เพื่อใช้ระบบได้ทันที · Priority: High · 3 pts
**AC**
- username/password ถูกต้อง → ไปหน้าหลัก
- ข้อมูลผิด → แจ้ง error ที่ **ไม่บอกว่าผิดช่องไหน**
- ออกจากระบบ → session สิ้นสุด
**Test cases:** TC-US11-01 ล็อกอินสำเร็จ · TC-US11-02 รหัสผ่านผิด · TC-US11-03 เข้าหน้าที่ต้องล็อกอินโดยไม่ได้ล็อกอิน → เด้งไปหน้า login (NFR03)

| ส่วน | งาน | ไฟล์ |
|---|---|---|
| DB | ตาราง `accounts(student_id PK, password_hash, created_at)` — เก็บ hash (`werkzeug.security`) ห้ามเก็บรหัสผ่านตรง ๆ; seed บัญชีทดสอบ | `backend-python/db.py` |
| BE | `POST /api/auth/login` (ผิด → 401 `INVALID_CREDENTIALS` ข้อความเดียวกันทั้ง user/password), `POST /api/auth/logout`, `GET /api/auth/me`; ตั้ง `app.secret_key` จาก env `SECRET_KEY` | `backend-python/auth_service.py` (ใหม่), `app.py` |
| FE | หน้า `#/login` + ฟอร์ม (ใช้ Field/Button/Alert), ปุ่มออกจากระบบใน AppHeader, route guard: ถ้า `/api/auth/me` ได้ 401 ให้ไป `#/login` | `frontend/js/pages/LoginPage.js`, `features/auth/LoginForm.js`, `api/auth.js` + `api/mock/auth.json`, `router.js`, `store.js`, `components/layout/AppHeader.js` |
| Test | TC-US11-01..03 | `backend-python/tests/test_tc_us11_*.py`, `frontend/tests/` (guard) |

หมายเหตุ: ยังไม่มีบัญชีจริงจาก reg — ใช้ตาราง `accounts` ในระบบก่อน (ถามทีมว่าจะต่อ TU API จริงหรือไม่ ถ้าต่อให้คุยกับปอ)

---
## US12 — ยกเลิกการจองอัตโนมัติเมื่อไม่มา <a id="us12"></a>
**Story:** ในฐานะผู้ใช้คนอื่นที่ต้องการที่จอด ต้องการให้ระบบคืนช่องที่คนจองไม่มาตามเวลา · Priority: High · 3 pts · Depends: US7
**AC**
- เลยเวลาเริ่ม + grace period แล้วไม่สแกน QR → สถานะ `auto_cancelled`, คืนช่อง, ส่งแจ้งเตือน
- สแกน QR ภายใน grace period → ไม่ถูกยกเลิก (`checked_in`)
- แสดง grace period ให้ผู้ใช้เห็นตอนจอง (เสนอ 15 นาที — ทีมยืนยัน)
**Test cases:** TC-US12-01 ยกเลิกหลังเลย grace · TC-US12-02 สแกนทันเวลา · TC-US12-03 ช่องว่างและจองใหม่ได้หลังยกเลิก

| ส่วน | งาน | ไฟล์ |
|---|---|---|
| BE | `sweep_no_shows(conn, now)`: หา `active` ที่ `start + NO_SHOW_GRACE_MIN < now` → `auto_cancelled`, เขียนแถว `notifications` (type `auto_cancelled`); เรียกแบบ lazy ที่ต้นทุก request ที่อ่านรายการจอง/ช่อง (ไม่ต้องมี cron) | `backend-python/no_show_service.py` (ใหม่), `app.py` |
| BE | `POST /api/reservations/<code>/check-in` → `checked_in` (ไม่ได้อยู่ในช่วง grace → 422) | `app.py` |
| FE | แสดงข้อความ "ต้องสแกนภายใน X นาทีหลังเวลาเริ่ม" ใน BookingSummary และ TicketCard; ส่ง grace ผ่าน `GET /api/zones` (เพิ่มฟิลด์ `grace_min`) | `frontend/js/features/booking/BookingSummary.js`, `features/ticket/TicketCard.js`, `api/mock/zones.json` |
| Test | TC-US12-01..03 โดยฉีด `now_func` (มีใน `create_app`) | `backend-python/tests/test_tc_us12_*.py` |

ประสานกับ Dev 4: ใช้ `status` และตาราง `notifications` ชุดเดียวกับ US3/US4 อย่าสร้างซ้ำ
