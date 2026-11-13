"""Unit tests สำหรับระบบลงทะเบียนสมาชิก (US2)"""

import unittest
import os
import tempfile
from datetime import datetime

from app import create_app
from db import connect, init_db

class TestMemberRegistration(unittest.TestCase):
    def setUp(self):
        self.db_fd, self.db_path = tempfile.mkstemp()
        init_db(self.db_path)
        
        conn = connect(self.db_path)
        conn.execute(
            "INSERT INTO students (student_id, name, email) VALUES (?, ?, ?)",
            ("6809650799", "สมชาย ใจดี", "somchai.j@dome.tu.ac.th")
        )
        conn.commit()
        conn.close()

        self.app = create_app(db_path=self.db_path, now_func=lambda: datetime(2026, 11, 12, 10, 0, 0))
        self.client = self.app.test_client()

    def tearDown(self):
        os.close(self.db_fd)
        os.unlink(self.db_path)

    def test_register_success_and_auto_login(self):
        """ทดสอบบันทึกสำเร็จและสามารถล็อกอินอัตโนมัติได้"""
        payload = {
            "student_id": "6809650799",
            "name": "สมชาย ใจดี",
            "phone": "0812345679",
            "email": "somchai.j@dome.tu.ac.th",
            "password": "securepassword123",
            "vehicle_type": "car",
            "plate": "1กข 1234",
            "province": "กรุงเทพมหานคร"
        }
        response = self.client.post("/api/members", json=payload)
        self.assertEqual(response.status_code, 201)
        data = response.get_json()
        self.assertTrue(data["ok"])
        self.assertEqual(data["member"]["student_id"], "6809650799")

        with self.client.session_transaction() as sess:
            self.assertEqual(sess.get("student_id"), "6809650799")

    def test_register_missing_fields(self):
        """ทดสอบกรณีข้อมูลไม่ครบ"""
        payload = {
            "student_id": "6809650799",
            "name": "สมชาย ใจดี"
        }
        response = self.client.post("/api/members", json=payload)
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertFalse(data["ok"])
        self.assertEqual(data["error"]["code"], "VALIDATION_ERROR")

    def test_register_student_not_found(self):
        """ทดสอบกรณีไม่พบ student_id ในตาราง students (ห้ามสร้าง EXT-xxxx) -> 404 STUDENT_NOT_FOUND"""
        payload = {
            "student_id": "9999999999",
            "name": "Unknown",
            "phone": "0898765432",
            "email": "unknown@tu.ac.th",
            "password": "securepassword123",
            "vehicle_type": "car",
            "plate": "ชม 5678",
            "province": "เชียงใหม่"
        }
        response = self.client.post("/api/members", json=payload)
        self.assertEqual(response.status_code, 404)
        data = response.get_json()
        self.assertEqual(data["error"]["code"], "STUDENT_NOT_FOUND")

    def test_register_duplicate_member(self):
        """ทดสอบกรณีมีบัญชีแล้วหรืออีเมลซ้ำ -> 409 MEMBER_DUPLICATE"""
        payload = {
            "student_id": "6809650799",
            "name": "สมชาย ใจดี",
            "phone": "0812345679",
            "email": "somchai.j@dome.tu.ac.th",
            "password": "securepassword123",
            "vehicle_type": "car",
            "plate": "1กข 1234",
            "province": "กรุงเทพมหานคร"
        }
        # สมัครครั้งแรก
        self.client.post("/api/members", json=payload)
        # สมัครซ้ำรอบสอง
        response = self.client.post("/api/members", json=payload)
        self.assertEqual(response.status_code, 409)
        data = response.get_json()
        self.assertEqual(data["error"]["code"], "MEMBER_DUPLICATE")

    def test_register_invalid_vehicle_type(self):
        """ทดสอบกรณีประเภทรถผิด (ต้อง car หรือ motorcycle เท่านั้น)"""
        payload = {
            "student_id": "6809650799",
            "name": "สมชาย ใจดี",
            "phone": "0812345679",
            "email": "somchai.j@dome.tu.ac.th",
            "password": "securepassword123",
            "vehicle_type": "spaceship",
            "plate": "1กข 1234",
            "province": "กรุงเทพมหานคร"
        }
        response = self.client.post("/api/members", json=payload)
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertEqual(data["error"]["code"], "VALIDATION_ERROR")

    def test_register_short_password(self):
        """ทดสอบกรณีรหัสผ่านสั้นเกินไป (< 8 ตัวอักษร)"""
        payload = {
            "student_id": "6809650799",
            "name": "สมชาย ใจดี",
            "phone": "0812345679",
            "email": "somchai.j@dome.tu.ac.th",
            "password": "123",
            "vehicle_type": "motorcycle",
            "plate": "1กข 1234",
            "province": "กรุงเทพมหานคร"
        }
        response = self.client.post("/api/members", json=payload)
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertEqual(data["error"]["code"], "VALIDATION_ERROR")

if __name__ == "__main__":
    unittest.main()