"""TC-US7-04  จองนอกเวลาทำการ  (AC4, C04: เปิด 08:00-20:00)
"""

from us7_support import ReservationTestCase


class TestUS7_04_OutsideOpeningHours(ReservationTestCase):

    def test_tc_us7_04_booking_outside_opening_hours_is_rejected(self):
        cases = [
            ("07:00", "08:00"),  # ก่อนเปิดทั้งช่วง
            ("07:30", "09:00"),  # เริ่มก่อนเปิด
            ("19:30", "20:30"),  # สิ้นสุดหลังปิด
            ("20:00", "21:00"),  # หลังปิดทั้งช่วง
            ("21:00", "22:00"),
        ]
        for start, end in cases:
            with self.subTest(start=start, end=end):
                self.assertRejected(self.book("A1", start, end), 422, "OUTSIDE_HOURS")
        self.assertEqual(len(self.db_rows()), 0)  # ไม่มีอะไรลงฐานข้อมูล

    def test_tc_us7_04_exact_opening_and_closing_times_are_allowed(self):
        self.assertEqual(self.book("A1", "08:00", "09:00").status_code, 201)  # เริ่มตรงเวลาเปิด
        self.assertEqual(self.book("A2", "19:00", "20:00").status_code, 201)  # สิ้นสุดตรงเวลาปิด
        self.assertEqual(self.book("A3", "08:00", "20:00").status_code, 201)  # ทั้งวัน

    def test_tc_us7_04_end_must_be_after_start(self):
        for start, end in [("10:00", "10:00"), ("11:00", "10:00")]:
            with self.subTest(start=start, end=end):
                self.assertRejected(self.book("A1", start, end), 400, "VALIDATION_ERROR")
        self.assertEqual(len(self.db_rows()), 0)
