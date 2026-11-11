"""ทะเบียนรถตอนจอง: ทะเบียนผิด -> INVALID_PLATE (400) และไม่บันทึกลงฐานข้อมูล"""
import unittest

from us7_support import DAY, ReservationTestCase


class BookingPlateTest(ReservationTestCase):
    def post(self, **extra):
        payload = {
            "user_name": "สมชาย ใจดี",
            "slot_id": self.slots["A1"],
            "date": DAY,
            "start": "10:00",
            "end": "11:00",
            **extra,
        }
        return self.client.post("/api/reservations", json=payload)

    def test_valid_plate_is_saved_and_returned(self):
        response = self.post(plate="  1กข   1234 ", vehicle_type="ev")
        self.assertEqual(response.status_code, 201, response.get_data(as_text=True))
        reservation = response.get_json()["reservation"]
        self.assertEqual(reservation["plate"], "1กข 1234")
        self.assertEqual(reservation["vehicle_type"], "ev")

        found = self.client.get(f"/api/reservations/{reservation['code']}").get_json()
        self.assertEqual(found["reservation"]["plate"], "1กข 1234")

    def test_invalid_plate_is_rejected_without_saving(self):
        for plate in ("ABC 1234", "กข", "1234", "กขคง 1234", "กข 12345"):
            with self.subTest(plate=plate):
                self.assertRejected(self.post(plate=plate), 400, "INVALID_PLATE")
        self.assertEqual(self.db_rows(), [])

    def test_empty_plate_is_rejected(self):
        self.assertRejected(self.post(plate="   "), 400, "VALIDATION_ERROR")
        self.assertEqual(self.db_rows(), [])

    def test_unknown_vehicle_type_is_rejected(self):
        self.assertRejected(self.post(plate="กข 1234", vehicle_type="truck"), 400, "VALIDATION_ERROR")

    def test_plate_is_optional_for_old_clients(self):
        response = self.post()
        self.assertEqual(response.status_code, 201)
        self.assertIsNone(response.get_json()["reservation"]["plate"])


if __name__ == "__main__":
    unittest.main()
