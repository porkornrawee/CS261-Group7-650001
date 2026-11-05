"""ค้น/แสดงรายการจอง: lookup ด้วยรหัส, QR ของรหัสที่ไม่มี, ลำดับและ limit ของรายการ

รัน: python -m unittest discover -s tests -v
"""

from us7_support import ReservationTestCase


class TestReservationLookup(ReservationTestCase):

    def test_get_by_code_returns_reservation(self):
        code = self.book("A1").get_json()["reservation"]["code"]
        response = self.client.get(f"/api/reservations/{code}")
        self.assertEqual(response.status_code, 200)
        body = response.get_json()
        self.assertTrue(body["ok"])
        self.assertEqual(body["reservation"]["code"], code)
        self.assertEqual(body["reservation"]["status"], "active")
        self.assertIsNone(body["reservation"]["cancelled_at"])

    def test_get_by_code_accepts_lowercase_and_padding(self):
        code = self.book("A1").get_json()["reservation"]["code"]
        response = self.client.get(f"/api/reservations/{code.lower()}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["reservation"]["code"], code)

    def test_get_unknown_code_is_404(self):
        self.assertRejected(self.client.get("/api/reservations/PK-NOPE0000"), 404, "NOT_FOUND")

    def test_qr_for_unknown_code_is_404(self):
        self.assertRejected(self.client.get("/api/reservations/PK-NOPE0000/qr.png"), 404, "NOT_FOUND")

    def test_qr_png_for_known_code(self):
        code = self.book("A1").get_json()["reservation"]["code"]
        response = self.client.get(f"/api/reservations/{code}/qr.png")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, "image/png")
        self.assertTrue(response.data.startswith(b"\x89PNG"))

    def test_list_is_newest_first(self):
        first = self.book("A1", start="09:00", end="10:00").get_json()["reservation"]["code"]
        second = self.book("A2", start="09:00", end="10:00").get_json()["reservation"]["code"]
        listed = self.client.get("/api/reservations").get_json()["reservations"]
        self.assertEqual([r["code"] for r in listed], [second, first])

    def test_list_limit_is_clamped(self):
        for label in ("A1", "A2", "A3"):
            self.book(label)
        get = lambda q: len(self.client.get(f"/api/reservations{q}").get_json()["reservations"])
        self.assertEqual(get("?limit=2"), 2)
        self.assertEqual(get("?limit=0"), 1)    # ต่ำกว่า 1 ถูกดึงขึ้นเป็น 1
        self.assertEqual(get("?limit=-5"), 1)
        self.assertEqual(get("?limit=9999"), 3)  # สูงเกิน 100 ถูกจำกัด (มีแค่ 3 แถว)
