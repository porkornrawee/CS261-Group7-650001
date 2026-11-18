"""Vercel entrypoint: Flask เสิร์ฟทั้ง API (backend-python) ที่ /api/* และหน้าเว็บ (frontend/)
เดโมชั่วคราว: Vercel ไม่มีดิสก์ถาวร ฐานข้อมูล SQLite อยู่ใน /tmp จึงหายเมื่อเซิร์ฟเวอร์รีสตาร์ต"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "backend-python"))
os.environ.setdefault("PARKING_DB", "/tmp/parking.db")

from flask import abort, send_from_directory  # noqa: E402

from app import create_app  # noqa: E402

FRONTEND = os.path.join(ROOT, "frontend")

app = create_app()
app.static_folder = FRONTEND  # "/" (index) เสิร์ฟ frontend/index.html แทนหน้าเก่าใน backend-python/static


@app.get("/<path:filename>")
def frontend_files(filename):
    if filename.startswith("api/"):
        abort(404)
    return send_from_directory(FRONTEND, filename)
