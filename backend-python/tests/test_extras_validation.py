"""เพิ่มเติม: การตรวจข้อมูลนำเข้าและกฎพื้นฐานอื่น ๆ
"""

import unittest
from us7_support import DAY, ReservationTestCase


class TestInputValidationAndExtras(ReservationTestCase):

    def test_missing_name_or_slot_is_rejected(self):
        base = {"date": DAY, "start": "10:00", "end": "11:00"}
        bad_payloads = [
            {**base, "slot_id": self.slots["A1"]},                      # ไม่มีชื่อ
            {**base, "slot_id": self.slots["A1"], "user_name": "   "},  # ชื่อว่าง
            {**base, "user_name": "สมชาย"},                             # ไม่ได้เลือกช่อง
            {**base, "user_name": "สมชาย", "slot_id": None},
            {"user_name": "สมชาย", "slot_id": self.slots["A1"]},        # ไม่มีวัน/เวลา
        ]
        for payload in bad_payloads:
            with self.subTest(payload=payload):
                response = self.client.post("/api/reservations", json=payload)
                self.assertRejected(response, 400, "VALIDATION_ERROR")
        self.assertEqual(len(self.db_rows()), 0)

    def test_unknown_slot_and_malformed_body(self):
        response = self.client.post(
            "/api/reservations",
            json={"user_name": "สมชาย", "slot_id": 9999, "date": DAY, "start": "10:00", "end": "11:00"},
        )
        self.assertRejected(response, 404, "SLOT_NOT_FOUND")

        response = self.client.post(
            "/api/reservations", data="ไม่ใช่ JSON", content_type="application/json"
        )
        self.assertRejected(response, 400, "VALIDATION_ERROR")

    def test_booking_in_the_past_is_rejected(self):
        """ระบบจองล่วงหน้า: ตอนนี้คือ 15 ต.ค. 2026 เวลา 12:00"""
        self.assertRejected(self.book("A1", date="2026-10-14"), 422, "PAST_TIME")
        self.assertRejected(self.book("A1", "09:00", "10:00", date="2026-10-15"), 422, "PAST_TIME")
        self.assertEqual(self.book("A1", "13:00", "14:00", date="2026-10-15").status_code, 201)

    def test_ui_page_is_served(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("จองที่จอดรถ", response.get_data(as_text=True))
        response.close()  # ปิดไฟล์ static ที่ถูกเปิดค้างไว้


if __name__ == "__main__":
    unittest.main(verbosity=2)
