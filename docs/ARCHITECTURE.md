# สถาปัตยกรรมระบบจองที่จอดรถ (มธ.)

## ภาพรวมวันนี้ (Demo)
```
เบราว์เซอร์ ──► nginx (:8080) ─┬─ /        → frontend/ (HTML/CSS/JS ล้วน ES modules)
                               └─ /api/*   → api (Flask + SQLite)  ← โค้ดเดิม backend-python/
```
- `frontend/` — UI ใหม่ทั้งหมด แบ่ง component ชัดเจน
- `backend-python/` — โค้ดเดิมย้ายมาไม่แก้ logic (เพิ่มแค่ `HOST` env ใน `app.py` เพื่อให้รันใน Docker ได้) เทส 4 เคส TC-US7-01..04 ยังผ่าน
- ฟีเจอร์ "ลงทะเบียนรถ/ยืนยันนักศึกษา" **ยังไม่มี backend** → Frontend ใช้ `?mock=1` ตาม contract ใน `frontend/js/api/vehicles.js`

## เป้าหมายหลัง Demo
```
frontend (nginx) ──► Spring Boot ──► PostgreSQL
                         ├──► TU REST API   (เรียกจาก backend เท่านั้น เก็บ Application-Key ใน env)
                         └──► qr-service (Python/FastAPI)
```
Spring Boot: `VehicleController/Service/Repository`, `ReservationController/...`, `TuApiClient`, Flyway migration
PostgreSQL: ใช้ `EXCLUDE USING gist (slot_id WITH =, tsrange(start_at, end_at) WITH &&)` กันจองซ้อนแทน trigger ของ SQLite
เทส Python เดิมใช้เป็น spec เขียนเทส Java ตาม

## ข้อสังเกตจากการตรวจโค้ด (ลำดับความสำคัญ)
| ระดับ | ประเด็น | การจัดการ |
|---|---|---|
| 🔴 | แผนภาพเดิมให้ `script.js` เรียก TU REST API ตรง → Key หลุดฝั่ง client และผู้ใช้ข้ามการตรวจได้ | แก้แผนภาพ: script.js → `POST /api/vehicles/verify` → backend → TU API |
| 🔴 | UI ไฟล์เดียว 716 บรรทัด แยกงานไม่ได้ | แทนด้วย `frontend/` แบบ component (เสร็จที่โครง) |
| 🟠 | ไม่มีการระบุตัวตน (พิมพ์ชื่อเอง `user_name`) | ผูกการจองกับ student/vehicle ที่ยืนยันแล้ว (ขั้น backend) |
| 🟠 | Flask เสิร์ฟหน้าเว็บเอง | nginx เสิร์ฟ frontend (ทำแล้วใน docker-compose) |
| 🟡 | โซน/ช่อง hard-code ใน `config.py`, เวลาไม่มี timezone, QR วาดทีละพิกเซล (`qr_service.py`) | backlog หลัง Demo |
| ✅ | กฎจอง + กันจองซ้อน 2 ชั้น + เทสอัตโนมัติ | ใช้ต่อ |

`backend-python/static/` (index.html + css/ + js/) คือ UI เก่า เก็บไว้เป็นอ้างอิงตอนย้าย logic (เทสเดิมเรียก `/` อยู่) **ลบได้เมื่อ frontend ใหม่ครบ** พร้อมแก้เทสข้อนั้น

## แผนที่โค้ดเดิม → ที่ใหม่
โค้ดเดิมอยู่ใน `backend-python/static/js/` (เลขบรรทัดอ้างตามไฟล์ที่แยกแล้ว) รายละเอียดแบบเดินทีละขั้นดูที่ `README.md` หัวข้อ "แผนที่โค้ดเก่า"

| โค้ดเดิม (ไฟล์:บรรทัด) | ไปที่ |
|---|---|
| `dom.js:2` `h()`, `dom.js:20` `icon()` | `frontend/js/core/dom.js` (CO-01) |
| `time-utils.js:1-15` `pad/ymd/toMin/fromMin/durationText/thaiDate` | `frontend/js/core/time.js` (CO-02) |
| `api.js:1-4` `api()` | `frontend/js/api/client.js` (CO-03) |
| `time-picker.js:2` `renderDates`, `:17` `renderTimes`, `:25` `renderDurations`, `:31` `applyDuration` | `DateStrip`, `TimeChips`, `DurationPicker` (BK-01..03) |
| `parking-lot.js:2` `loadLayout`, `:28` `resetBays`, `:44` `refreshAvailability` | `ParkingLot`, `ZoneBlock`, `SlotBay` (BK-04..06) + `api/zones.js` |
| `parking-lot.js:86` `updatePick`, `booking-form.js:2` submit | `BookingSummary` (BK-07), `BookingPage` |
| `ticket.js:2` `showTicket`, `:20` `showError`, `:29` `loadRecent` | `TicketCard`, `api/errors.js`, `ReservationTable` |

## Sequence ฟีเจอร์ยืนยันทะเบียนรถ (ฉบับแก้)
นักศึกษากรอกข้อมูล → `VehicleForm.onSubmit` → `VehiclePage` เรียก `verifyStudent()` → `POST /api/vehicles/verify` → backend เรียก TU API → ผ่าน: `saveVehicle()` → `POST /api/vehicles` → บันทึกลง DB → แสดง `VehicleCard` · ไม่ผ่าน: แสดง `StudentVerifyStatus` สถานะ invalid
