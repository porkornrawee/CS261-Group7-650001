# CS261-Group7-650001

ระบบจองที่จอดรถอัจฉริยะ (Smart Parking Reservation System)
CS261 Introduction to Software Engineering — กลุ่มที่ 7, Section 650001

## กติกาหลัก

- **ห้าม push ตรงเข้า `master`** — ทำงานทุกอย่างบน branch แยกเสมอ
- **ตั้งชื่อ branch:** `<area>/<type>-<short-desc>`
  - `area` = `fe` (frontend) หรือ `be` (backend)
  - `type` = `feat` | `fix` | `chore` | `docs` | `refactor`
  - เช่น `fe/feat-login-ui`, `be/fix-booking-overlap`
- **Commit message** ตาม Conventional Commits: `<type>(<scope>): <message>`
  - เช่น `feat(be): add parking slot reservation api`
- **ก่อน push ทุกครั้ง** ให้ `git pull --rebase origin master` ก่อนเสมอ
- **ห้าม commit secret** (.env, password, key ต่างๆ) — ใส่ไว้ใน `.gitignore` เสมอ
- ทุกงานต้องผ่าน **Pull Request + review อย่างน้อย 1 คน** ก่อน merge เข้า `master`
- แนะนำใช้ **Squash & Merge** เพื่อให้ history อ่านง่าย

## Workflow

```
git checkout master && git pull --rebase
git checkout -b <area>/<type>-<desc>

# ...ทำงาน...
git add .
git commit -m "<type>(<scope>): <message>"

git pull --rebase origin master   # ก่อน push ทุกครั้ง
git push -u origin <area>/<type>-<desc>
# เปิด PR -> รอ review -> merge เข้า master

# หลัง merge แล้ว ลบ branch ทิ้ง
git checkout master && git pull --rebase
git branch -d <area>/<type>-<desc>
git push origin --delete <area>/<type>-<desc>
```

## แก้ Conflict

```
git pull --rebase origin master
# แก้ไฟล์ที่ชนกัน (<<<<<<< / ======= / >>>>>>>)
git add <ไฟล์ที่แก้>
git rebase --continue
```

ถ้าพังมาก ใช้ `git rebase --abort` แล้วเริ่มใหม่

## กติกา Issue

- งานทุกอย่าง (ฟีเจอร์/บั๊ก) **เปิด Issue ก่อนเริ่มทำ** เพื่อ track และคุยกันในทีม
- ใช้ template ที่มีให้ (Bug report / Feature request) เวลากด New Issue
- ตั้งชื่อ branch/commit ให้ตรงกับ Issue ที่ทำ และใส่ `closes #<เลข issue>` ใน PR description เพื่อให้ปิด Issue อัตโนมัติตอน merge
- ใส่ label ให้ตรงประเภท (`bug`, `enhancement`) และ assign คนรับผิดชอบ

## กติกา Pull Request

- **PR ขนาดเล็ก** ทำทีละงาน อย่ารวมหลายฟีเจอร์ใน PR เดียว — รีวิวเร็ว conflict น้อย
- **ชื่อ PR** ให้สื่อความหมาย ตรงกับ branch/commit เช่น `feat(fe): login form + validation`
- **คำอธิบายใน PR ต้องมี:**
  - **What** — ทำอะไรบ้าง
  - **Why** — ทำไมต้องทำ (เกี่ยวกับ feature/issue ไหน)
  - **How to test** — ทดสอบยังไง
- Branch ต้อง **rebase กับ `master` ล่าสุดแล้ว** ก่อนขอ review (ไม่ควรมี conflict ค้าง)
- ต้องมี **อย่างน้อย 1 reviewer approve** ก่อน merge
- แก้ตามคอมเมนต์รีวิว → commit/push เพิ่มใน branch เดิม (ไม่ต้องเปิด PR ใหม่)
- Merge ด้วย **Squash & Merge** แล้วลบ branch ทิ้งทันที

---

> โครงสร้างโฟลเดอร์ (frontend/backend) และรายละเอียดการรันโปรเจกต์ จะเพิ่มใน README เมื่อเริ่มตั้งโค้ดจริง
