"""จองได้ครั้งละ 1 รายการ: ต้องยกเลิก/รอให้หมดเวลาก่อนจึงจองใหม่ได้"""

import unittest

from us7_support import ReservationTestCase


class SingleActiveBookingTests(ReservationTestCase):
    enforce_single_booking = True

    def test_second_booking_is_rejected_while_first_is_active(self):
        self.assertEqual(self.book("A1", "10:00", "11:00").status_code, 201)
        self.assertRejected(self.book("A2", "13:00", "14:00"), 409, "ALREADY_HAS_BOOKING")
        self.assertEqual(len(self.db_rows()), 1)

    def test_other_user_is_not_affected(self):
        other = self.new_client("6500000002", "ผู้ใช้ อื่น")
        self.assertEqual(self.book("A1").status_code, 201)
        self.assertEqual(self.book("A2", client=other).status_code, 201)

    def test_can_book_again_after_cancel(self):
        code = self.book("A1").get_json()["reservation"]["code"]
        cancelled = self.client.post(f"/api/reservations/{code}/cancel")
        self.assertEqual(cancelled.status_code, 200, cancelled.get_data(as_text=True))
        self.assertEqual(self.book("A2", "13:00", "14:00").status_code, 201)


if __name__ == "__main__":
    unittest.main()
