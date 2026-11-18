"""การจองผูกกับบัญชีที่ล็อกอิน: ต้องล็อกอินก่อนจอง, ดูได้เฉพาะของตัวเอง, ชื่อมาจากบัญชี, จองล่วงหน้าได้ไม่เกิน 30 วัน"""

import unittest
from datetime import timedelta

from config import MAX_ADVANCE_DAYS
from us7_support import FIXED_NOW, ReservationTestCase


class BookingOwnershipTests(ReservationTestCase):
    def setUp(self):
        super().setUp()
        self.other = self.new_client("6500000002", "ผู้ใช้ อื่น")
        self.anon = self.app.test_client()

    def test_booking_requires_login(self):
        self.assertRejected(self.book("A1", client=self.anon), 401, "UNAUTHORIZED")
        self.assertEqual(len(self.db_rows()), 0)

    def test_other_user_cannot_see_my_reservation(self):
        code = self.book("A1").get_json()["reservation"]["code"]
        self.assertEqual(self.client.get(f"/api/reservations/{code}").status_code, 200)
        self.assertEqual(self.client.get(f"/api/reservations/{code}/qr.png").status_code, 200)

        self.assertRejected(self.other.get(f"/api/reservations/{code}"), 404, "NOT_FOUND")
        self.assertEqual(self.other.get(f"/api/reservations/{code}/qr.png").status_code, 404)
        self.assertEqual(self.other.get("/api/reservations").get_json()["reservations"], [])
        self.assertEqual(self.other.get("/api/me/reservations").get_json()["reservations"], [])

    def test_session_for_missing_student_is_401_not_500(self):
        """cookie ยังอยู่แต่ DB ไม่มีนักศึกษานี้แล้ว (เช่น DB ถูกรีเซ็ต) -> 401 ไม่ใช่ 500"""
        import sqlite3
        from contextlib import closing
        with closing(sqlite3.connect(self.db_path)) as conn:
            conn.execute("DELETE FROM students WHERE student_id = '6500000002'")
            conn.commit()
        self.assertRejected(self.book("A1", client=self.other), 401, "UNAUTHORIZED")
        self.assertEqual(len(self.db_rows()), 0)

    def test_anonymous_cannot_read_reservations(self):
        code = self.book("A1").get_json()["reservation"]["code"]
        self.assertEqual(self.anon.get("/api/reservations").status_code, 401)
        self.assertEqual(self.anon.get(f"/api/reservations/{code}").status_code, 401)
        self.assertEqual(self.anon.get(f"/api/reservations/{code}/qr.png").status_code, 401)

    def test_list_returns_only_my_reservations(self):
        mine = self.book("A1").get_json()["reservation"]["code"]
        theirs = self.book("A2", client=self.other).get_json()["reservation"]["code"]
        codes = [r["code"] for r in self.client.get("/api/reservations").get_json()["reservations"]]
        self.assertEqual(codes, [mine])
        self.assertNotIn(theirs, codes)

    def test_holder_name_comes_from_account_not_request(self):
        response = self.book("A1", name="ชื่อปลอมของคนอื่น")
        self.assertEqual(response.status_code, 201, response.get_data(as_text=True))
        self.assertEqual(response.get_json()["reservation"]["user_name"], "สมชาย ใจดี")
        self.assertEqual(self.db_rows()[0][2], "สมชาย ใจดี")

    def test_cannot_book_more_than_max_days_ahead(self):
        last_ok = (FIXED_NOW + timedelta(days=MAX_ADVANCE_DAYS)).strftime("%Y-%m-%d")
        too_far = (FIXED_NOW + timedelta(days=MAX_ADVANCE_DAYS + 1)).strftime("%Y-%m-%d")
        self.assertEqual(self.book("A1", date=last_ok).status_code, 201)
        self.assertRejected(self.book("A2", date=too_far), 422, "TOO_FAR_AHEAD")
        self.assertEqual(len(self.db_rows()), 1)


if __name__ == "__main__":
    unittest.main()
