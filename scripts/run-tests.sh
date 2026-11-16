#!/usr/bin/env bash
# รันเทสทั้งโปรเจกต์ด้วยคำสั่งเดียว:  ./scripts/run-tests.sh
#   backend  : python unittest (backend-python/tests)
#   frontend : node --test (frontend/tests/*.test.mjs)
# ออกด้วย exit code 0 ถ้าผ่านทั้งหมด, 1 ถ้ามีเทสใดล้ม
set -u
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FAIL=0

# ใช้ .venv ของ backend ถ้ามี (ต้องมี Flask) ไม่งั้นใช้ python3 ของเครื่อง
if [ -x "$ROOT/backend-python/.venv/bin/python" ]; then
  PY="$ROOT/backend-python/.venv/bin/python"
else
  PY="$(command -v python3 || command -v python)"
fi

echo "=== Backend (python unittest) ==="
( cd "$ROOT/backend-python" && "$PY" -m unittest discover -s tests ) || FAIL=1

echo
echo "=== Frontend (node --test) ==="
if command -v node >/dev/null 2>&1; then
  ( cd "$ROOT/frontend" && node --test tests/*.test.mjs ) || FAIL=1
else
  echo "ไม่พบ node — ข้ามเทส frontend" >&2
  FAIL=1
fi

echo
if [ "$FAIL" -eq 0 ]; then echo "ผ่านทั้งหมด"; else echo "มีเทสที่ไม่ผ่าน"; fi
exit "$FAIL"
