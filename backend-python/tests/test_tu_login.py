"""US11: เข้าสู่ระบบด้วยบัญชี มธ. ผ่าน TU API (ใช้ client จำลอง ไม่เรียกเน็ตจริง)"""

import unittest

from app import create_app
from booking_service import BookingError
from us7_support import FIXED_NOW, ReservationTestCase


class FakeTu:
    def __init__(self):
        self.calls = 0

    def verify_login(self, username, password):
        self.calls += 1
        if username == "down":
            raise BookingError("TU_UNAVAILABLE", "ระบบตรวจสอบของ มธ. ไม่พร้อมใช้งานชั่วคราว", 502)
        if username == "6509650999" and password == "tu-pass":
            return {"student_id": username, "name": "สมชาย มธ."}
        return None


class TuLoginTests(ReservationTestCase):
    def setUp(self):
        super().setUp()
        self.fake = FakeTu()
        self.app = create_app(db_path=self.db_path, now_func=lambda: FIXED_NOW, tu_client=self.fake)
        self.app.secret_key = "test-only-secret"
        self.client = self.app.test_client()

    def login(self, sid, pw):
        return self.client.post("/api/auth/login", json={"student_id": sid, "password": pw})

    def test_tu_user_can_log_in_and_is_mirrored(self):
        res = self.login("6509650999", "tu-pass")
        self.assertEqual(res.status_code, 200, res.get_data(as_text=True))
        self.assertEqual(res.get_json()["user"], {"student_id": "6509650999", "name": "สมชาย มธ."})
        self.assertEqual(self.client.get("/api/auth/me").status_code, 200)

    def test_wrong_tu_password_is_rejected(self):
        res = self.login("6509650999", "nope")
        self.assertEqual(res.status_code, 401)
        self.assertEqual(res.get_json()["error"]["code"], "INVALID_CREDENTIALS")

    def test_tu_outage_returns_502(self):
        res = self.login("down", "x")
        self.assertEqual(res.status_code, 502)
        self.assertEqual(res.get_json()["error"]["code"], "TU_UNAVAILABLE")

    def test_local_account_does_not_call_tu(self):
        from config import TEST_ACCOUNT
        res = self.login(TEST_ACCOUNT["student_id"], TEST_ACCOUNT["password"])
        self.assertEqual(res.status_code, 200)
        self.assertEqual(self.fake.calls, 0)


if __name__ == "__main__":
    unittest.main()
