# กติกากลางของทีม (CONVENTIONS)

## 1. Component
- รูปแบบ: `export function X(props) { return HTMLElement }` ใช้ `h()` จาก `js/core/dom.js`
- ข้อมูลเข้าทาง `props` เท่านั้น ส่งเหตุการณ์ออกทาง callback (`onSelect`, `onSubmit`, `onChange`)
- ห้ามอ่าน/แก้ DOM นอกตัวเอง (`document.querySelector` ใน component = ผิด)
- ทุกไฟล์มี JSDoc บนหัวไฟล์ (Owner / Ticket / props / Done when) — **ห้ามลบ ต้องอัปเดตให้ตรงถ้า props เปลี่ยน**

## 2. ชั้นของโค้ด (ใครเรียกใครได้)
```
pages/      → เรียก features/*, components/*, api/*, store.js ได้
features/   → เรียก components/ui/*, core/* ได้    (ห้ามเรียก api/)
components/ → เรียก core/* ได้เท่านั้น             (ห้ามรู้จัก api, store, features)
api/        → เรียก client.js เท่านั้น
```
ตรวจอัตโนมัติด้วยคำสั่งใน PR template

## 3. CSS
- สี/ระยะ/เงา/ฟอนต์ใช้ `var(--...)` จาก `css/tokens.css` **ห้าม hard-code hex** (ต้องการสีใหม่ → ขอ PM)
- 1 component = 1 ไฟล์ `.css` ข้าง `.js`; class ขึ้นต้นด้วยชื่อ component แบบ BEM: `.slot-bay`, `.slot-bay--booked`, `.slot-bay__label`
- ไฟล์ CSS ถูก `@import` ใน `css/components.css` แล้ว (PM ทำให้ครบ) ไม่ต้องเพิ่ม
- Mobile-first: ออกแบบที่ 375px ก่อน ขยายด้วย `@media (min-width: 768px)`
- สถานะต้องแยกได้โดย "ไม่พึ่งสีอย่างเดียว" (ข้อความ/ลาย/ไอคอน)

## 4. API และ Error
- `fetch(` ใช้ได้ที่ `js/api/client.js` ที่เดียว
- หน้าที่ต้องการข้อมูล เรียกฟังก์ชันใน `js/api/*.js` ซึ่งรองรับ `?mock=1` (เปิด `http://localhost:8080/?mock=1`)
- ข้อความ error ไทยมาจาก `messageFor(error)` ใน `api/errors.js` ที่เดียว
- รูปแบบ response ตาม `backend-python/README.md` หัวข้อ API (ฟิลด์ `ok`, `error.code`, `error.message`)
- เบราว์เซอร์ **ห้ามเรียก TU REST API ตรง** — เรียกผ่าน `/api/vehicles/verify` เท่านั้น

## 5. Git
- ใช้กติกา Git ของทีมใน `README.md` (ส่วนบนของไฟล์): branch `<area>/<type>-<desc>` เช่น `fe/feat-slot-bay` · commit แบบ Conventional Commits เช่น `feat(fe): add SlotBay (BK-06)` · `git pull --rebase origin master` ก่อน push · ห้าม push ตรง `master` · PR ต้องมีคนอื่นอย่างน้อย 1 คน approve · Squash & Merge
- ใส่เลข ticket (เช่น BK-06) ในชื่อ PR และ commit เพื่อให้ตามงานได้
- 1 PR = 1 ticket · ไม่แก้ไฟล์ของคนอื่นใน PR ตัวเอง (ถ้าจำเป็นให้บอกเจ้าของก่อน)

| ผู้เขียน | Reviewer หลัก |
|---|---|
| Dev 1 | Dev 3 |
| Dev 2 | Dev 1 |
| Dev 3 | Dev 4 |
| Dev 4 | Dev 2 |

## 6. Definition of Done (ทุก ticket)
- [ ] ทำงานตาม JSDoc contract และเกณฑ์ผ่านของ ticket
- [ ] เปิดด้วย `?mock=1` แล้วใช้งานได้ ไม่มี error ใน console
- [ ] หน้าจอ 375px ไม่มี scroll แนวนอน
- [ ] ใช้คีย์บอร์ดได้ (Tab/Enter) และมี label ให้ screen reader
- [ ] ไม่มี `todo()` ค้างในไฟล์ของ ticket นั้น
- [ ] ผ่านการ review ไขว้ 1 คน

## 7. รันโปรเจกต์
```bash
# Frontend อย่างเดียว (ไม่ต้องมี backend) — ES modules เปิดจาก file:// ไม่ได้
cd frontend && python3 -m http.server 8080      # เปิด http://localhost:8080/?mock=1

# ทั้งระบบ
docker compose up --build                        # เปิด http://localhost:8080
```
