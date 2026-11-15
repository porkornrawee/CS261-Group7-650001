"""ทะเบียนรถตอนจอง: ทะเบียนผิด -> INVALID_PLATE (400) และไม่บันทึกลงฐานข้อมูล

[QA] (US1) เคส 2: ทะเบียนไม่ถูกต้อง -> 400, ไม่มีแถวใน DB, ไม่มี QR
  (test_invalid_plate_is_rejected_without_saving)

รันเฉพาะไฟล์นี้: python -m unittest discover -s tests -p "test_booking_plate.py" -v
"""
import unittest

from us7_support import DAY, ReservationTestCase

# ทะเบียนผิดที่ใช้ทดสอบ (การ์ด QA ต้องอย่างน้อย 3 แบบ)
INVALID_PLATES = (
    "ABC 123",     # ตัวอักษรอังกฤษ (ตัวอย่างจากการ์ด)
    "00กก 12",     # เลขนำหน้า 2 หลัก (ตัวอย่างจากการ์ด)
    "ABC 1234",    # ตัวอักษรอังกฤษ + เลข 4 หลัก
    "กข",          # ไม่มีตัวเลข
    "1234",        # ไม่มีพยัญชนะ
    "กขคง 1234",   # พยัญชนะเกิน 3 ตัว
    "กข 12345",    # ตัวเลขเกิน 4 หลัก
)


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
        """[QA US1 เคส 2] ทะเบียนไม่ถูกต้อง -> 400, ไม่มีแถวใน DB, ไม่มี QR"""
        self.assertGreaterEqual(len(INVALID_PLATES), 3)
        self.assertEqual(self.db_rows(), [], "ฐานข้อมูลต้องว่างก่อนเริ่มเทส")

        for plate in INVALID_PLATES:
            with self.subTest(plate=plate):
                response = self.post(plate=plate)

                # 1) ได้ 400 พร้อมรหัส INVALID_PLATE และข้อความบอกผู้ใช้
                self.assertRejected(response, 400, "INVALID_PLATE")

                # 2) ไม่มีแถวใน DB
                self.assertEqual(self.db_rows(), [])

                # 3) ไม่มี QR และไม่มีการจองใน response
                body = response.get_json()
                for key in ("reservation", "qr_data_uri", "qr_url"):
                    self.assertNotIn(key, body)

        # ไม่มีการจองให้ดึง QR ได้เลย
        listed = self.client.get("/api/reservations").get_json()["reservations"]
        self.assertEqual(listed, [])

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
