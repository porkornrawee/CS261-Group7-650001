# CS261-Group7-650001

ระบบจองที่จอดรถอัจฉริยะ (Smart Parking Reservation System)
CS261 Introduction to Software Engineering — กลุ่มที่ 7, Section 650001

## กติกาหลัก

- **ห้าม push ตรงเข้า `main`** — ทำงานทุกอย่างบน branch แยกเสมอ
- **ตั้งชื่อ branch:** `<area>/<type>-<short-desc>`
  - `area` = `fe` (frontend) หรือ `be` (backend)
  - `type` = `feat` | `fix` | `chore` | `docs` | `refactor`
  - เช่น `fe/feat-login-ui`, `be/fix-booking-overlap`
- **Commit message** ตาม Conventional Commits: `<type>(<scope>): <message>`
  - เช่น `feat(be): add parking slot reservation api`
- **ก่อน push ทุกครั้ง** ให้ `git pull --rebase origin main` ก่อนเสมอ
- **ห้าม commit secret** (.env, password, key ต่างๆ) — ใส่ไว้ใน `.gitignore` เสมอ
- ทุกงานต้องผ่าน **Pull Request + review อย่างน้อย 1 คน** ก่อน merge เข้า `main`
- แนะนำใช้ **Squash & Merge** เพื่อให้ history อ่านง่าย

## Workflow

```
git checkout main && git pull --rebase
git checkout -b <area>/<type>-<desc>

# ...ทำงาน...
git add .
git commit -m "<type>(<scope>): <message>"

git pull --rebase origin main   # ก่อน push ทุกครั้ง
git push -u origin <area>/<type>-<desc>
# เปิด PR -> รอ review -> merge เข้า main

# หลัง merge แล้ว ลบ branch ทิ้ง
git checkout main && git pull --rebase
git branch -d <area>/<type>-<desc>
git push origin --delete <area>/<type>-<desc>
```

## แก้ Conflict

```
git pull --rebase origin main
# แก้ไฟล์ที่ชนกัน (<<<<<<< / ======= / >>>>>>>)
git add <ไฟล์ที่แก้>
git rebase --continue
```

ถ้าพังมาก ใช้ `git rebase --abort` แล้วเริ่มใหม่

---

> โครงสร้างโฟลเดอร์ (frontend/backend) และรายละเอียดการรันโปรเจกต์ จะเพิ่มใน README เมื่อเริ่มตั้งโค้ดจริง
