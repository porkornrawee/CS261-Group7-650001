# Sprint 2 — แบ่งงาน Dev 1–4

อ้างอิง Trello: https://trello.com/b/rf7yaT3q/cs261-group7-2 (ลิสต์ **Sprint2 Backlog (User Story)** และ To do/Doing/Done (Task))

> Dev แต่ละคนทำ **ครบทั้ง Frontend + Backend + Database + Test** ของ US ที่ตัวเองรับ
> งานแต่ละชิ้นมี GitHub Issue ที่ assign ให้แล้ว · ทำเสร็จให้ติ๊ก Definition of Done ใน Trello/Issue แล้วย้ายการ์ดไป **Reviewing & Testing**
> ปอ (porkornrawee) ตรวจและทดสอบ → ย้ายไป **Complete** หรือ **Rework**

## ใครทำอะไร

| Dev | ผู้รับผิดชอบ | GitHub | งาน | เอกสาร |
|---|---|---|---|---|
| Dev 1 | ไอซ์ | TayadaDeesakul | CORE-01 (สัญญากลาง) · US11 เข้าสู่ระบบ · US12 ยกเลิกอัตโนมัติ/เช็กอิน | [DEV1.md](DEV1.md) |
| Dev 2 | เมย์ | Mars-128-8 | US2 สมัครสมาชิกภายนอก · US1 แก้ไขทะเบียนรถ · เชื่อม UI จอง→API (ร่วม Dev 3) | [DEV2.md](DEV2.md) |
| Dev 3 | โมชิ | Nattanan-P | US9 ต่อเวลา · US8 แสดงตำแหน่งช่อง (ร่วม Dev 4) · QA ทดสอบอัตโนมัติ US1 / UI Test Cases | [DEV3.md](DEV3.md) |
| Dev 4 | ข้าวปั้น | Kawpun-byte | US3 ยกเลิกการจอง · US5 ประวัติ · US4 แจ้งเตือน · QR Code | [DEV4.md](DEV4.md) |
| PM/Review | ปอ | porkornrawee | Reviewing & Testing → Complete / Rework · งาน SQLite + TU API (branch `be/feat-tu-api-sqlite`) | — |

การ์ด Trello "[BE] (Core) สร้าง Spring Boot" **ไม่ใช้แล้ว** — โปรเจกต์รันบน Flask + SQLite อยู่แล้ว จึงเปลี่ยนเป็นงานใหม่ **CORE-01** ของ Dev 1 (ด้านล่าง)

## ลำดับพึ่งพา (ใครรอใคร)

```
ปอ: merge be/feat-tu-api-sqlite (students/vehicles + TU API)
        │
Dev 1: CORE-01 (schema + auth helper + error codes)   ← ทุกคนรอ ทำก่อนเป็นอย่างแรก
        ├── Dev 1: US11 login ──► (ทุก endpoint /api/me/* ใช้ @login_required)
        ├── Dev 4: US3 cancel ──► US5 history ──► US4 notifications
        │                    └──► Dev 1: US12 auto-cancel (ใช้ status/notifications เดียวกัน)
        ├── Dev 3: US9 extend,  US8 (ร่วม Dev 4: ใช้รายการจองของฉัน)
        └── Dev 2: US2 / US1-edit (ใช้ตาราง students/vehicles)
```

ระหว่างรอ CORE-01 ให้ฝั่ง FE ทำต่อด้วย `?mock=1` (เพิ่ม mock ใน `frontend/js/api/mock/`) ได้เลย

## CORE-01 — สัญญากลางที่ทุกคนต้องใช้ร่วมกัน (Dev 1 ทำ)

ทำใน PR เดียว merge เข้า master ให้เร็วที่สุด (เป้า: 1–2 วันแรก)

**Database (`backend-python/db.py`, เพิ่มแบบ idempotent ใน `init_db()`)**
- `reservations` เพิ่มคอลัมน์: `student_id` (FK → students), `status` (`active | checked_in | completed | cancelled | auto_cancelled`, default `active`), `cancelled_at`, `checked_in_at`
- แก้ trigger กันจองซ้อน: ไม่นับแถวที่ `status IN ('cancelled','auto_cancelled')` เพื่อให้ช่องที่ยกเลิกถูกจองใหม่ได้ (US3, US12)
- ตารางใหม่ `notifications(id, student_id, reservation_id, type, message, created_at, read_at)` — `type`: `near_start | near_expiry | cancelled | auto_cancelled | zone_full`

**Config (`backend-python/config.py`)**
- `CANCEL_DEADLINE_MIN = 30`, `NOTIFY_BEFORE_MIN = 15`, `NO_SHOW_GRACE_MIN = 15` (ทีมยังต้องยืนยันค่าตาม AC)

**Auth helper (`backend-python/auth.py` ใหม่)**
- Flask `session` + decorator `@login_required` ที่ตั้ง `g.student_id`; ไม่ได้ล็อกอิน → 401 `UNAUTHORIZED`; เข้าถึงของคนอื่น → 403 `FORBIDDEN`
- `POST /api/reservations` ต้องบันทึก `student_id` จาก session (เดิมไม่มี owner)

**Error codes ใหม่** (เพิ่มทั้ง backend และ `frontend/js/api/errors.js` พร้อมข้อความไทย)

| code | HTTP | ใช้ใน |
|---|---|---|
| `UNAUTHORIZED` | 401 | ทุก endpoint ที่ต้องล็อกอิน |
| `FORBIDDEN` | 403 | ดู/แก้ของคนอื่น |
| `INVALID_CREDENTIALS` | 401 | US11 |
| `CANCEL_DEADLINE_PASSED` | 422 | US3 |
| `NOT_CANCELLABLE` | 409 | US3 (ยกเลิกไปแล้ว/ใช้ไปแล้ว) |
| `EXTEND_CONFLICT` | 409 | US9 |

**สัญญา API ของแต่ละ US** (รูปแบบ response ละเอียดอยู่ในเอกสารของแต่ละ Dev — ใครแก้สัญญาต้องแจ้งในแชทก่อน)

| Endpoint | เจ้าของ |
|---|---|
| `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` | Dev 1 |
| `POST /api/reservations/<code>/check-in` + `sweep_no_shows(conn, now)` | Dev 1 |
| `POST /api/members`, `PUT /api/vehicles/<id>` | Dev 2 |
| `POST /api/reservations/<code>/extend` | Dev 3 |
| `POST /api/reservations/<code>/cancel`, `GET /api/me/reservations?status=`, `GET /api/me/notifications` | Dev 4 |

## กติกา Git / PR (ย่อ — ฉบับเต็มดู `docs/CONVENTIONS.md`)
- Branch: `be/feat-us3-cancel`, `fe/feat-us3-cancel` (`<area>/<type>-<desc>`) · ถ้าทำทั้ง FE+BE ในงานเดียวใช้ `be/` หรือ `fe/` ตามส่วนหลัก หรือแยก PR
- Commit แบบ Conventional Commits `feat(be): ... (US3)` · PR ชื่อมี `(US3)` และเขียน `closes #<เลข issue>`
- `git pull --rebase origin master` ก่อน push · ห้าม push เข้า master · ใช้ PR template · Squash & Merge
- ผู้รีวิว: Dev1→Dev3, Dev2→Dev1, Dev3→Dev4, Dev4→Dev2 แล้วปอตรวจ/ทดสอบขั้นสุดท้าย

## Definition of Done (ติ๊กครบก่อนย้ายการ์ดไป Reviewing & Testing)
- [ ] ผ่านเกณฑ์ (AC) ครบทุกข้อของ US บนการ์ด Trello
- [ ] มี test ฝั่ง backend ตาม TC-USx-xx ทุกข้อ (`tests/test_tc_usx_*.py`, ใช้ helper `tests/us7_support.py`) และรัน `python -m unittest discover -s tests -v` ผ่านทั้งหมด
- [ ] ฝั่ง frontend: ทำงานได้ทั้ง `?mock=1` และต่อ API จริง, ไม่มี error ใน console, ไม่มี horizontal scroll ที่ 375px, ใช้คีย์บอร์ดได้, `node --test frontend/tests` ผ่าน
- [ ] API ใหม่เขียนไว้ใน `backend-python/README.md` (request/response/error code)
- [ ] ไม่ hard-code สี (ใช้ tokens), ไม่ใช้ `fetch` นอก `api/client.js`, ไม่มี `todo()` ค้าง
- [ ] ไม่มี secret/คีย์ในโค้ด · ไม่ commit ไฟล์ `*.db`
- [ ] PR ผ่านรีวิว 1 คน + ปอตรวจ · การ์ด Trello ลิงก์กับ Issue/PR

## ข้อสังเกตจาก Trello (ต้องยืนยันกับทีม)
- US11 มีบรรทัด Trace เขียน Sprint 1 แต่ป้ายเป็น Sprint 2
- Dev 4 รับงานเยอะสุด (US3 + US5 + US4 + QR) — ถ้าเวลาไม่พอให้เลื่อน US4 ก่อน
