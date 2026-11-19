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
from db import connect, create_account  # noqa: E402

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
        self.app.secret_key = "test-only-secret"  # ให้ session cookie ใช้ได้ในเทส
        self.client = self.new_client("6500000001", "สมชาย ใจดี")  # จองได้เฉพาะผู้ล็อกอิน
        layout = self.client.get("/api/zones").get_json()
        self.slots = {
            slot["label"]: slot["id"]
            for zone in layout["zones"]
            for slot in zone["slots"]
        }

    def tearDown(self):
        shutil.rmtree(self.tmp_dir, ignore_errors=True)

    def act_as(self, student_id):
        """ให้ self.client เป็นผู้ใช้รหัสนี้ (ตั้ง session ตรง ๆ ใช้กับเทสที่แค่ต้องการ "ผู้ล็อกอินคนนั้น")"""
        student_id = str(student_id).strip()
        with closing(connect(self.db_path)) as conn:
            conn.execute("INSERT OR IGNORE INTO students (student_id, name) VALUES (?, ?)", (student_id, student_id))
            conn.commit()
        with self.client.session_transaction() as user_session:
            user_session["student_id"] = student_id

    def new_client(self, student_id, name, password="test-pass"):
        """สร้างบัญชี + client ที่ล็อกอินแล้ว (1 client = 1 ผู้ใช้ = 1 session)"""
        with closing(connect(self.db_path)) as conn:
            create_account(conn, student_id, password, name)
            conn.commit()
        client = self.app.test_client()
        response = client.post(
            "/api/auth/login", json={"student_id": student_id, "password": password}
        )
        assert response.status_code == 200, response.get_data(as_text=True)
        return client

    def book(self, label, start="10:00", end="11:00", date=DAY, name=None, client=None,
             plate=None, vehicle_type=None):
        # ชื่อผู้จองมาจากบัญชีที่ล็อกอิน; name ใช้ทดสอบว่า backend "ไม่สนใจ" ค่าที่ client ส่งมา
        payload = {
            "slot_id": self.slots[label],
            "date": date,
            "start": start,
            "end": end,
        }
        if name is not None:
            payload["user_name"] = name
        # ส่งทะเบียน/ประเภทรถเฉพาะเมื่อระบุ เพื่อให้เทสเดิมที่ไม่ส่งทำงานเหมือนเดิม
        if plate is not None:
            payload["plate"] = plate
        if vehicle_type is not None:
            payload["vehicle_type"] = vehicle_type
        return (client or self.client).post("/api/reservations", json=payload)

    def db_rows(self):
        """อ่านตาราง reservations จากไฟล์ฐานข้อมูลโดยตรง"""
        with closing(sqlite3.connect(self.db_path)) as conn:
            return conn.execute(
                "SELECT code, slot_id, user_name, start_at, end_at FROM reservations"
            ).fetchall()

    def db_reservations(self):
        """อ่านตาราง reservations แบบครบคอลัมน์ (คืน list ของ dict) ไม่กระทบรูปแบบของ db_rows()"""
        with closing(sqlite3.connect(self.db_path)) as conn:
            conn.row_factory = sqlite3.Row
            return [dict(row) for row in conn.execute("SELECT * FROM reservations ORDER BY id")]

    def zone_free(self, zone_name, start="10:00", end="11:00", date=DAY):
        """จำนวนช่องว่างของโซนในช่วงเวลา จาก GET /api/availability"""
        layout = self.client.get("/api/zones").get_json()
        zone_id = next(z["id"] for z in layout["zones"] if z["name"] == zone_name)
        availability = self.client.get(
            "/api/availability", query_string={"date": date, "start": start, "end": end}
        ).get_json()
        return next(z["free"] for z in availability["zones"] if z["id"] == zone_id)

    def assertRejected(self, response, status, code):
        self.assertEqual(response.status_code, status, response.get_data(as_text=True))
        body = response.get_json()
        self.assertFalse(body["ok"])
        self.assertEqual(body["error"]["code"], code)
        self.assertTrue(body["error"]["message"])  # ต้องมีข้อความภาษาไทยบอกผู้ใช้
