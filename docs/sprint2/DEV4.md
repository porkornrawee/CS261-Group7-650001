# Dev 4 — ข้าวปั้น (Kawpun-byte)

งาน: **US3** ยกเลิก · **US5** ประวัติ · **US4** แจ้งเตือน · **QR Code** · ร่วม **US8** (หน้ารายการจอง) · ภาพรวมดู [README.md](README.md)
รีวิวงานของคุณโดย: Dev 2 · คุณรีวิวงานของ: Dev 3

ลำดับ: รอ CORE-01 → US3 → US5 → US4 · ระหว่างรอทำ QR Code และ FE ด้วย `?mock=1` ก่อน
งานคุณเยอะสุด — ถ้าไม่ทัน ให้เลื่อน US4 ก่อนและบอกปอ

---
## BE (US1) — QR Code ของการจอง <a id="qr"></a>
Trello: `[BE] (US1) สร้าง QR Code ของการจองแบบสดๆ หลังจองสำเร็จ` (อยู่ Doing; มี `qr_service.py` และ `GET /api/reservations/<code>/qr.png` แล้ว)
- ตรวจให้ครบ: QR ไม่ซ้ำต่อการจอง, ดึงซ้ำจากประวัติได้, ข้อมูลใน QR ใช้ตรวจ/เช็กอินได้ (US12 ของ Dev 1 ใช้ code เดียวกัน) · ไฟล์ `backend-python/qr_service.py`, `tests/`

---
## US3 — ยกเลิกการจอง <a id="us3"></a>
**Story:** ผู้ใช้ที่มีการจองต้องการยกเลิกเมื่อไปไม่ได้ เพื่อคืนช่องให้คนอื่น · Priority: Medium · 2 pts · Depends: US7
**AC**
- ยกเลิกได้ก่อนเส้นตาย (เสนอ: ก่อนเวลาเริ่ม ≥ 30 นาที — `CANCEL_DEADLINE_MIN`)
- ยกเลิกแล้วช่องว่างทันที (จองใหม่ได้)
- เลยเส้นตายยกเลิกไม่ได้
**Test cases:** TC-US3-01 ยกเลิกในช่วงที่อนุญาต · TC-US3-02 ยกเลิกหลังเลยเส้นตายถูกปฏิเสธ

| ส่วน | งาน | ไฟล์ |
|---|---|---|
| DB | ใช้คอลัมน์ `status/cancelled_at` และ trigger ที่ Dev 1 แก้ใน CORE-01 | `backend-python/db.py` |
| BE | `POST /api/reservations/<code>/cancel` (`@login_required`): ไม่ใช่เจ้าของ 403, สถานะไม่ใช่ `active` → 409 `NOT_CANCELLABLE`, เลย `start - CANCEL_DEADLINE_MIN` → 422 `CANCEL_DEADLINE_PASSED`; สำเร็จ → `status='cancelled'`, `cancelled_at=now`, เขียน `notifications` (type `cancelled`) | `backend-python/cancel_service.py` (ใหม่), `app.py` |
| FE | ปุ่ม "ยกเลิกการจอง" ใน TicketCard + dialog ยืนยัน (ปิดปุ่มเมื่อเลยเส้นตายพร้อมข้อความ), refresh สถานะ | `frontend/js/features/ticket/TicketCard.js`, `features/ticket/CancelDialog.js` (ใหม่), `api/reservations.js` (`cancelReservation`) + mock, `api/errors.js` |
| Test | TC-US3-01, -02 + ยกเลิกซ้ำ + ยกเลิกของคนอื่น + จองช่องเดิมได้หลังยกเลิก | `backend-python/tests/test_tc_us3_*.py` |

---
## US5 — ประวัติการจองและการยกเลิก <a id="us5"></a>
**Story:** ผู้ใช้ดูประวัติการจอง/ยกเลิกของตัวเองเพื่อทบทวนการใช้งาน · Priority: Low · 2 pts
**AC**
- เห็นเฉพาะประวัติของตัวเอง (NFR03)
- กรองตามสถานะ: เสร็จสิ้น (`completed`) / ยกเลิกเอง (`cancelled`) / ยกเลิกอัตโนมัติ (`auto_cancelled`)
**Test cases:** TC-US5-01 ดูประวัติจอง/ยกเลิก · TC-US5-02 กรองตามสถานะ · TC-US5-03 ผู้ใช้อื่นเข้าถึงไม่ได้

| ส่วน | งาน | ไฟล์ |
|---|---|---|
| BE | `GET /api/me/reservations?status=` กรองตาม `g.student_id` เสมอ (ไม่รับ student_id จาก query); สถานะ `completed` คำนวณจาก `end_time < now` สำหรับแถว `active/checked_in` | `backend-python/history_service.py` (ใหม่), `app.py` |
| FE | HistoryPage: ตัวกรองสถานะ (Chip), ReservationTable แสดงสถานะด้วย Badge, EmptyState; เปลี่ยนจาก `GET /api/reservations` (ทั้งระบบ) เป็นของฉัน | `frontend/js/pages/HistoryPage.js`, `features/history/ReservationTable.js`, `api/reservations.js` + mock |
| Test | TC-US5-01..03 (03: ล็อกอินเป็น A ต้องไม่เห็นของ B) | `backend-python/tests/test_tc_us5_*.py` |

หน้ารายการจองของ US8 (T19) ใช้ endpoint เดียวกันนี้ — ประสานกับ Dev 3

---
## US4 — แจ้งเตือนสถานะการจอง <a id="us4"></a>
**Story:** ผู้ใช้ต้องการแจ้งเตือนเมื่อใกล้เริ่ม/ใกล้หมดเวลา/ถูกยกเลิก เพื่อมาจอดหรือออกทันเวลา · Priority: Medium · 3 pts
**AC**
- แจ้งก่อนเริ่ม (เสนอ 15 นาที = `NOTIFY_BEFORE_MIN`), ใกล้หมดเวลา, และเมื่อยกเลิก
- (Optional) แจ้งเมื่อโซนที่ติดตามเต็ม
- ข้อความบอกช่องและเวลา
**Test cases:** TC-US4-01 แจ้งเตือนใกล้เริ่ม/หมดเวลา · TC-US4-02 แจ้งเตือนเมื่อยกเลิก · TC-US4-03 โซนเต็ม (optional)

| ส่วน | งาน | ไฟล์ |
|---|---|---|
| BE | `generate_due_notifications(conn, now)` สร้างแถวใน `notifications` ตามเวลา (กันซ้ำด้วย `(reservation_id, type)`) เรียกแบบ lazy คู่กับ sweep ของ Dev 1; `GET /api/me/notifications` (+ `POST .../read`); แจ้งเมื่อยกเลิกมาจาก US3/US12 อยู่แล้ว | `backend-python/notification_service.py` (ใหม่), `app.py` |
| FE | ไอคอนกระดิ่งใน AppHeader + จำนวนที่ยังไม่อ่าน, รายการแจ้งเตือน (poll ทุก 30–60 วิ), Toast เมื่อมีใหม่ | `frontend/js/components/layout/AppHeader.js`, `features/notification/NotificationList.js` (ใหม่), `api/notifications.js` + mock |
| Test | TC-US4-01..02 โดยฉีดเวลา (`now_func`), ไม่สร้างซ้ำเมื่อเรียกหลายครั้ง | `backend-python/tests/test_tc_us4_*.py` |

---
## US8 — หน้ารายการจอง (ส่วนของ Dev 4) <a id="us8"></a>
T19 หน้ารายการจอง: ดูรายละเอียดและแบ่งงานกับ Dev 3 ที่ [DEV3.md](DEV3.md#us8)
