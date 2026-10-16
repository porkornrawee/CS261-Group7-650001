"""ตัวช่วยร่วมของเทส US7: ฐานข้อมูลชั่วคราวต่อ 1 เทส + ตัวช่วยยิง API + ถอดรหัส QR

ไฟล์เทสแต่ละ TC import ReservationTestCase, DAY, FIXED_NOW, decode_qr จากที่นี่
"""

import os
import shutil
import sqlite3
import sys
import tempfile
import unittest
from contextlib import closing
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app  # noqa: E402

try:  # ใช้ถอดรหัสภาพ QR กลับมาพิสูจน์ว่าสแกนได้จริง (ไม่มีก็ข้ามเฉพาะเทสนั้น)
    import cv2
    import numpy as np
except ImportError:  # pragma: no cover
    cv2 = None

FIXED_NOW = datetime(2026, 10, 15, 12, 0, 0)  # ล็อกเวลา "ตอนนี้" ให้ผลเทสคงที่
DAY = "2026-10-20"  # วันในอนาคตที่ใช้ทดสอบ


def decode_qr(png_bytes):
    image = cv2.imdecode(np.frombuffer(png_bytes, np.uint8), cv2.IMREAD_COLOR)
    text, _, _ = cv2.QRCodeDetector().detectAndDecode(image)
    return text


class ReservationTestCase(unittest.TestCase):
    """พื้นฐานร่วม: ฐานข้อมูลใหม่ทุกเทส + ตัวช่วยยิง API"""

    def setUp(self):
        self.tmp_dir = tempfile.mkdtemp(prefix="parking-test-")
        self.db_path = os.path.join(self.tmp_dir, "test.db")
        self.app = create_app(db_path=self.db_path, now_func=lambda: FIXED_NOW)
        self.client = self.app.test_client()
        layout = self.client.get("/api/zones").get_json()
        self.slots = {
            slot["label"]: slot["id"]
            for zone in layout["zones"]
            for slot in zone["slots"]
        }

    def tearDown(self):
        shutil.rmtree(self.tmp_dir, ignore_errors=True)

    def book(self, label, start="10:00", end="11:00", date=DAY, name="สมชาย ใจดี", client=None):
        return (client or self.client).post(
            "/api/reservations",
            json={
                "user_name": name,
                "slot_id": self.slots[label],
                "date": date,
                "start": start,
                "end": end,
            },
        )

    def db_rows(self):
        """อ่านตาราง reservations จากไฟล์ฐานข้อมูลโดยตรง"""
        with closing(sqlite3.connect(self.db_path)) as conn:
            return conn.execute(
                "SELECT code, slot_id, user_name, start_at, end_at FROM reservations"
            ).fetchall()

    def assertRejected(self, response, status, code):
        self.assertEqual(response.status_code, status, response.get_data(as_text=True))
        body = response.get_json()
        self.assertFalse(body["ok"])
        self.assertEqual(body["error"]["code"], code)
        self.assertTrue(body["error"]["message"])  # ต้องมีข้อความภาษาไทยบอกผู้ใช้
