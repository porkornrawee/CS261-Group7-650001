# Dev 3 — โมชิ (Nattanan-P)

งาน: **US9** ต่อเวลา · **US8** แสดงตำแหน่งช่อง (ร่วม Dev 4) · **QA** Automated Test ของ US1 + UI Test Cases · ร่วม **#40** ต่อ UI จองเข้ากับ API · ภาพรวมดู [README.md](README.md)
รีวิวงานของคุณโดย: Dev 4 · คุณรีวิวงานของ: Dev 1

ลำดับ: #40 (ร่วม Dev 2) + QA US1 (ทำได้ทันที ไม่ต้องรอ CORE-01) → US9 → US8 → UI Test Cases

---
## QA (US1) — Automated Test การจอง 4 เคส <a id="qa-us1"></a>
Trello: `[QA] (US1) เขียน Automated Test ตรวจสอบการจองที่จอดรถทั้ง 4 เคส`
- 4 เคส: จองสำเร็จ (TC-US7-01), ซ้อนช่อง (-02), โซนเต็ม (-03), นอกเวลา (-04) — ตอนนี้มี unit test ฝั่ง backend แล้ว (`backend-python/tests/test_tc01..04_*.py`)
- งานที่เพิ่ม: ตรวจว่าครอบคลุมจริง, เพิ่ม test ระดับ API ผ่าน Flask test client ที่ตรวจ response/HTTP status/error code ครบ, เพิ่ม test ฝั่ง frontend ว่า `errors.js` แปลง 4 code เป็นข้อความไทยถูก, เขียนคำสั่งรันรวมไว้ใน `backend-python/README.md`
- ไฟล์: `backend-python/tests/`, `frontend/tests/errors.test.mjs`

## #40 — ต่อหน้าจองเข้ากับ API จริง (ร่วม Dev 2) <a id="fe-40"></a>
ดูแบ่งงานใน [DEV2.md](DEV2.md#fe-40) — ฝั่งคุณ: แสดง error 4 เคสในหน้า (Alert), ผังช่องรีเฟรชหลังจอง/ชนกัน, ปุ่มยืนยันปิดจนกว่าเลือกครบ · ไฟล์ `pages/BookingPage.js`, `features/booking/*`

---
## US9 — ต่อเวลาการจอง <a id="us9"></a>
**Story:** ผู้ใช้ที่มีการจองอยู่ต้องการต่อเวลาถ้าช่องยังว่าง จะได้ไม่ต้องจองใหม่ · Priority: Medium · 3 pts · Depends: US7
**AC**
- ต่อได้เฉพาะเมื่อช่องว่างในช่วงที่ต่อ
- มีคนจองช่วงถัดไปแล้ว → ปฏิเสธ
- ต่อเกินเวลาปิดลานไม่ได้
**Test cases:** TC-US9-01 ต่อสำเร็จ · TC-US9-02 ปฏิเสธเพราะช่องถูกจอง · TC-US9-03 ปฏิเสธเพราะเกินเวลาปิด

| ส่วน | งาน | ไฟล์ |
|---|---|---|
| BE | `POST /api/reservations/<code>/extend` body `{minutes}` (30/60/120): ตรวจเจ้าของ (`@login_required`, 403), สถานะต้อง `active|checked_in`, เวลาใหม่ไม่เกิน `CLOSE_TIME` (422 `OUTSIDE_HOURS`), ช่วงที่ต่อชนการจองอื่น → 409 `EXTEND_CONFLICT` (ใช้ logic ตรวจซ้อนเดียวกับ `booking_service.py`, ใส่ใน `BEGIN IMMEDIATE`), อัปเดต `end_time` | `backend-python/extend_service.py` (ใหม่) หรือเพิ่มใน `booking_service.py`, `app.py` |
| DB | ไม่ต้องเพิ่มตาราง (ใช้ trigger กันซ้อนเดิม; เทสต์ว่า trigger ครอบคลุมการ UPDATE `end_time` ด้วย — ถ้าไม่ ให้แจ้ง Dev 1 เพิ่ม `BEFORE UPDATE` trigger) | `backend-python/db.py` |
| FE | ปุ่ม "ต่อเวลา" ในบัตรจอง (TicketCard) → ตัวเลือกเวลาที่ต่อได้ (ปิดตัวเลือกที่เกินเวลาปิด) → แสดงผล/ข้อความ error | `frontend/js/features/ticket/TicketCard.js`, `features/ticket/ExtendDialog.js` (ใหม่), `api/reservations.js` (`extendReservation`) + mock, `api/errors.js` |
| Test | TC-US9-01..03 | `backend-python/tests/test_tc_us9_*.py`, `frontend/tests/` |

---
## US8 — แสดงตำแหน่งช่องจอดที่จอง (ร่วม Dev 4) <a id="us8"></a>
Trello: T19 หน้ารายการจอง · T20 ไฮไลต์ช่องบนผัง · T21 ทดสอบ TC-US8-01, -02
- **Dev 3:** T20 ไฮไลต์ช่องบนผัง (ParkingLot/SlotBay รับ prop `highlightSlotId`; ใช้ลายขีด/ขอบ ไม่พึ่งสีอย่างเดียว) + T21 test
- **Dev 4:** T19 หน้ารายการจอง (ใช้ `GET /api/me/reservations` ของ Dev 4 / ตาราง `ReservationTable`) — คลิกแถว → ไปแสดงผังพร้อมไฮไลต์
- ไฟล์: `frontend/js/features/booking/ParkingLot.js`, `SlotBay.js`, `pages/HistoryPage.js` หรือหน้าใหม่ `pages/MyBookingsPage.js`; test `frontend/tests/`

---
## QA (US7) — ออกแบบ UI Test Cases <a id="qa-ui"></a>
Trello: `[QA] (US7) ออกแบบ Test Cases สำหรับ UI`
- เอกสารตาราง test case: ปุ่มจองใช้ได้ตามเงื่อนไข, แจ้งเตือนทะเบียนผิด, หน้าจอที่ 375px, การใช้คีย์บอร์ด, ข้อความ error ภาษาไทย
- ไฟล์: `docs/sprint2/ui-test-cases.md` (สร้างใหม่) — ใช้ขั้นตอนทดสอบด้วย `?mock=1` และแบบต่อ API จริง
