"""US11 (Dev 1): เข้าสู่ระบบด้วยบัญชี — TC-US11-01..03"""

import unittest
from contextlib import closing

from us7_support import ReservationTestCase
from config import TEST_ACCOUNT
from db import connect, create_account

STUDENT = "6501234567"
PASSWORD = "correct-horse"


class LoginTests(ReservationTestCase):
    def setUp(self):
        super().setUp()
        self.app.secret_key = "test-only-secret"
        with closing(connect(self.db_path)) as conn:
            create_account(conn, STUDENT, PASSWORD, "สมหญิง ทดสอบ")

    def login(self, student_id=STUDENT, password=PASSWORD):
        return self.client.post("/api/auth/login", json={"student_id": student_id, "password": password})

    # --- TC-US11-01 -------------------------------------------------------

    def test_tc_us11_01_login_success_starts_session(self):
        response = self.login()
        self.assertEqual(response.status_code, 200, response.get_data(as_text=True))
        body = response.get_json()
        self.assertEqual(body["user"], {"student_id": STUDENT, "name": "สมหญิง ทดสอบ"})

        me = self.client.get("/api/auth/me")
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.get_json()["user"]["student_id"], STUDENT)
        # session ใช้กับ endpoint ที่ต้องล็อกอินได้ทันที
        self.assertEqual(self.client.get("/api/me/reservations").status_code, 200)

    def test_tc_us11_01_seeded_test_account_can_log_in(self):
        response = self.login(TEST_ACCOUNT["student_id"], TEST_ACCOUNT["password"])
        self.assertEqual(response.status_code, 200, response.get_data(as_text=True))

    def test_password_is_stored_as_hash_only(self):
        with closing(connect(self.db_path)) as conn:
            stored = conn.execute(
                "SELECT password_hash FROM accounts WHERE student_id = ?", (STUDENT,)
            ).fetchone()["password_hash"]
        self.assertNotIn(PASSWORD, stored)
        self.assertTrue(stored.startswith("pbkdf2:sha256"))

    # --- TC-US11-02 -------------------------------------------------------

    def test_tc_us11_02_wrong_password_and_unknown_user_give_the_same_error(self):
        wrong_password = self.login(password="wrong")
        unknown_user = self.login(student_id="0000000000")
        self.assertRejected(wrong_password, 401, "INVALID_CREDENTIALS")
        self.assertRejected(unknown_user, 401, "INVALID_CREDENTIALS")
        self.assertEqual(
            wrong_password.get_json()["error"]["message"],
            unknown_user.get_json()["error"]["message"],
        )
        self.assertRejected(self.client.get("/api/auth/me"), 401, "UNAUTHORIZED")

    def test_missing_fields_are_validation_errors(self):
        self.assertRejected(self.client.post("/api/auth/login", json={}), 400, "VALIDATION_ERROR")
        self.assertRejected(self.client.post("/api/auth/login", data="x"), 400, "VALIDATION_ERROR")

    # --- TC-US11-03 -------------------------------------------------------

    def test_tc_us11_03_protected_endpoints_require_login(self):
        self.assertRejected(self.client.get("/api/auth/me"), 401, "UNAUTHORIZED")
        self.assertRejected(self.client.get("/api/me/reservations"), 401, "UNAUTHORIZED")

    def test_logout_ends_the_session(self):
        self.assertEqual(self.login().status_code, 200)
        self.assertEqual(self.client.post("/api/auth/logout").status_code, 200)
        self.assertRejected(self.client.get("/api/auth/me"), 401, "UNAUTHORIZED")
        self.assertRejected(self.client.get("/api/me/reservations"), 401, "UNAUTHORIZED")


if __name__ == "__main__":
    unittest.main()