"""ลงทะเบียนรถ (stub): verify กับ TU จำลอง + บันทึกทะเบียน

รัน: python -m unittest discover -s tests -v
"""

from us7_support import ReservationTestCase


class TestVehicles(ReservationTestCase):

    def verify(self, student_id="6410000001", email="somchai.j@dome.tu.ac.th"):
        return self.client.post(
            "/api/vehicles/verify", json={"student_id": student_id, "email": email}
        )

    def test_verify_ok(self):
        response = self.verify()
        self.assertEqual(response.status_code, 200)
        body = response.get_json()
        self.assertTrue(body["ok"])
        self.assertEqual(body["student"]["student_id"], "6410000001")
        self.assertEqual(body["student"]["email"], "somchai.j@dome.tu.ac.th")
        self.assertTrue(body["student"]["name"])

    def test_verify_student_id_ending_0000_is_not_found(self):
        self.assertRejected(self.verify(student_id="6410000000"), 404, "TU_NOT_FOUND")

    def test_verify_rejects_bad_student_id(self):
        self.assertRejected(self.verify(student_id="123"), 400, "VALIDATION_ERROR")

    def test_verify_rejects_non_tu_email(self):
        self.assertRejected(self.verify(email="a@gmail.com"), 400, "VALIDATION_ERROR")

    def test_verify_rejects_missing_body(self):
        response = self.client.post("/api/vehicles/verify")
        self.assertRejected(response, 400, "VALIDATION_ERROR")

    def test_save_vehicle(self):
        response = self.client.post(
            "/api/vehicles",
            json={"student_id": "6410000001", "plate": "1กข 1234", "province": "กรุงเทพมหานคร"},
        )
        self.assertEqual(response.status_code, 201)
        vehicle = response.get_json()["vehicle"]
        self.assertEqual(vehicle["plate"], "1กข 1234")
        self.assertEqual(vehicle["student_id"], "6410000001")

    def test_save_same_student_twice_keeps_id(self):
        payload = {"student_id": "6410000001", "plate": "1กข 1234", "province": "กรุงเทพมหานคร"}
        first = self.client.post("/api/vehicles", json=payload).get_json()["vehicle"]
        payload["plate"] = "2ขค 5678"
        second = self.client.post("/api/vehicles", json=payload).get_json()["vehicle"]
        self.assertEqual(first["id"], second["id"])
        self.assertEqual(second["plate"], "2ขค 5678")

    def test_save_rejects_missing_plate(self):
        response = self.client.post(
            "/api/vehicles",
            json={"student_id": "6410000001", "plate": "", "province": "กรุงเทพมหานคร"},
        )
        self.assertRejected(response, 400, "VALIDATION_ERROR")
