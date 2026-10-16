"""TC-US7-01  จองสำเร็จ + ได้ QR  (AC1)

รัน: python -m unittest discover -s tests -v
"""

import base64
from us7_support import DAY, ReservationTestCase, decode_qr, cv2


# ===========================================================================
class TestUS7_01_BookingSucceeds(ReservationTestCase):

    def test_tc_us7_01_book_and_receive_qr(self):
        """เลือกวัน/เวลา/ช่อง -> ยืนยัน -> ได้ QR และมีแถวในฐานข้อมูลจริง"""
        response = self.book("A1")

        self.assertEqual(response.status_code, 201)
        body = response.get_json()
        self.assertTrue(body["ok"])
        reservation = body["reservation"]
        self.assertTrue(reservation["code"].startswith("PK-"))
        self.assertEqual(reservation["slot"], "A1")
        self.assertEqual(reservation["zone"], "โซน A")
        self.assertEqual(
            (reservation["date"], reservation["start"], reservation["end"]),
            (DAY, "10:00", "11:00"),
        )
        self.assertTrue(body["qr_data_uri"].startswith("data:image/png;base64,"))

        rows = self.db_rows()  # ลงฐานข้อมูลจริง
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0][0], reservation["code"])
        self.assertEqual(rows[0][1], self.slots["A1"])
        self.assertEqual(rows[0][3:], (f"{DAY}T10:00", f"{DAY}T11:00"))

    def test_tc_us7_01_qr_image_is_scannable_and_matches_booking_code(self):
        """ภาพ QR เป็น PNG จริง และถอดรหัสกลับมาได้เป็นรหัสการจอง"""
        body = self.book("A1").get_json()
        code = body["reservation"]["code"]
        png = base64.b64decode(body["qr_data_uri"].split(",", 1)[1])
        self.assertEqual(png[:8], b"\x89PNG\r\n\x1a\n")

        served = self.client.get(body["qr_url"])  # เส้นทางดึงภาพ QR ซ้ำ
        self.assertEqual(served.status_code, 200)
        self.assertEqual(served.mimetype, "image/png")

        if cv2 is None:
            self.skipTest("ไม่มี opencv-python-headless จึงข้ามการถอดรหัสภาพ QR")
        self.assertEqual(decode_qr(png), code)
        self.assertEqual(decode_qr(served.get_data()), code)

    def test_tc_us7_01_booking_can_be_looked_up_by_code(self):
        """ด่านสแกน QR: ใช้รหัสค้นหาการจองที่บันทึกไว้ได้"""
        code = self.book("A3", name="สุดา").get_json()["reservation"]["code"]
        found = self.client.get(f"/api/reservations/{code}")
        self.assertEqual(found.status_code, 200)
        self.assertEqual(found.get_json()["reservation"]["slot"], "A3")
        self.assertEqual(found.get_json()["reservation"]["user_name"], "สุดา")
        self.assertEqual(self.client.get("/api/reservations/PK-NOSUCH99").status_code, 404)
