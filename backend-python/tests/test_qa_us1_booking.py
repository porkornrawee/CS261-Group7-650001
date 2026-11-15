"""[QA] (US1) Automated Test ตรวจสอบการจองที่จอดรถ

ยิงผ่าน API จริง (Flask test client) และตรวจฐานข้อมูล SQLite จริง
แต่ละเทสใช้ฐานข้อมูลชั่วคราวใหม่ และลบทิ้งหลังรัน (ดู us7_support.ReservationTestCase)
-> รันซ้ำกี่ครั้งผลก็เหมือนเดิม

รัน: cd backend-python && python -m unittest discover -s tests -p "test_qa_us1_booking.py" -v
"""

import base64
import sqlite3
import unittest
from contextlib import closing

from us7_support import DAY, ReservationTestCase, cv2, decode_qr

PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
START, END = "10:00", "11:00"


class QaUs1BookingTest(ReservationTestCase):
    """ตัวช่วยร่วมของเคส QA US1"""

    def post_booking(self, label, plate="1กข 1234", name="สมชาย ใจดี"):
        return self.client.post(
            "/api/reservations",
            json={
                "user_name": name,
                "slot_id": self.slots[label],
                "date": DAY,
                "start": START,
                "end": END,
                "plate": plate,
                "vehicle_type": "car",
            },
        )

    def zone_free(self, zone_name):
        """จำนวนช่องว่างของโซนในช่วงเวลาที่ทดสอบ จาก GET /api/availability"""
        layout = self.client.get("/api/zones").get_json()
        zone_id = next(z["id"] for z in layout["zones"] if z["name"] == zone_name)
        availability = self.client.get(
            "/api/availability", query_string={"date": DAY, "start": START, "end": END}
        ).get_json()
        return next(z["free"] for z in availability["zones"] if z["id"] == zone_id)

    def reservation_rows(self):
        """อ่านตาราง reservations จากไฟล์ฐานข้อมูลโดยตรง (ไม่ผ่าน API)"""
        with closing(sqlite3.connect(self.db_path)) as conn:
            conn.row_factory = sqlite3.Row
            return [dict(row) for row in conn.execute(
                "SELECT code, slot_id, user_name, start_at, end_at, plate, vehicle_type, status "
                "FROM reservations ORDER BY id"
            )]


class Case1BookingSucceeds(QaUs1BookingTest):
    """เคส 1: จองสำเร็จ -> ได้ 201, มีแถวใน DB, มี QR, ที่ว่างลดลง 1"""

    def test_case1_booking_succeeds(self):
        free_before = self.zone_free("โซน A")
        self.assertEqual(self.reservation_rows(), [], "ฐานข้อมูลต้องว่างก่อนเริ่มเทส")

        response = self.post_booking("A1")

        # 1) ได้ 201
        self.assertEqual(response.status_code, 201, response.get_data(as_text=True))
        body = response.get_json()
        self.assertTrue(body["ok"])
        reservation = body["reservation"]
        code = reservation["code"]
        self.assertTrue(code.startswith("PK-"))

        # 2) มีแถวใน DB ตรงกับที่จอง
        rows = self.reservation_rows()
        self.assertEqual(len(rows), 1)
        row = rows[0]
        self.assertEqual(row["code"], code)
        self.assertEqual(row["slot_id"], self.slots["A1"])
        self.assertEqual(row["user_name"], "สมชาย ใจดี")
        self.assertEqual(row["start_at"], f"{DAY}T{START}")
        self.assertEqual(row["end_at"], f"{DAY}T{END}")
        self.assertEqual(row["plate"], "1กข 1234")
        self.assertEqual(row["vehicle_type"], "car")
        self.assertEqual(row["status"], "active")

        # 3) มี QR: ใน response (data URI) และดึงภาพจาก qr_url ได้ เป็น PNG จริง
        prefix = "data:image/png;base64,"
        self.assertTrue(body["qr_data_uri"].startswith(prefix))
        inline_png = base64.b64decode(body["qr_data_uri"][len(prefix):])
        self.assertTrue(inline_png.startswith(PNG_SIGNATURE))

        self.assertEqual(body["qr_url"], f"/api/reservations/{code}/qr.png")
        qr_response = self.client.get(body["qr_url"])
        self.assertEqual(qr_response.status_code, 200)
        self.assertEqual(qr_response.mimetype, "image/png")
        self.assertTrue(qr_response.data.startswith(PNG_SIGNATURE))
        if cv2 is not None:  # มี opencv -> ถอดรหัสภาพ QR ต้องได้รหัสการจอง
            self.assertEqual(decode_qr(inline_png), code)

        # 4) ที่ว่างของโซนลดลง 1
        self.assertEqual(self.zone_free("โซน A"), free_before - 1)


if __name__ == "__main__":
    unittest.main()
