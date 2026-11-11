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

    def test_verify_email_is_case_insensitive_and_trimmed(self):
        response = self.verify(student_id=" 6410000001 ", email=" Somchai.J@DOME.TU.AC.TH ")
        self.assertEqual(response.status_code, 200)
        student = response.get_json()["student"]
        self.assertEqual(student["student_id"], "6410000001")
        self.assertEqual(student["email"], "somchai.j@dome.tu.ac.th")

    def test_verify_rejects_domain_only_email(self):
        self.assertRejected(self.verify(email="@dome.tu.ac.th"), 400, "VALIDATION_ERROR")

    def test_verify_rejects_non_string_fields(self):
        response = self.client.post(
            "/api/vehicles/verify", json={"student_id": 6410000001, "email": ["a@dome.tu.ac.th"]}
        )
        self.assertRejected(response, 400, "VALIDATION_ERROR")

    def test_save_rejects_bad_student_id(self):
        response = self.client.post(
            "/api/vehicles",
            json={"student_id": "abc", "plate": "1กข 1234", "province": "กรุงเทพมหานคร"},
        )
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


class TestUpdateVehicle(ReservationTestCase):
    """PUT /api/vehicles/<id> (US1): แก้ทะเบียนรถของตัวเอง"""

    OWNER = "6410000001"
    OTHER = "6410000002"

    def setUp(self):
        super().setUp()
        self.app.secret_key = "test-only-secret"
        self.vehicle_id = self.save(self.OWNER, "กข 1111", "กรุงเทพมหานคร")["id"]
        self.other_vehicle_id = self.save(self.OTHER, "1กข 1234", "กรุงเทพมหานคร")["id"]

    def save(self, student_id, plate, province):
        response = self.client.post(
            "/api/vehicles",
            json={"student_id": student_id, "plate": plate, "province": province},
        )
        self.assertEqual(response.status_code, 201, response.get_data(as_text=True))
        return response.get_json()["vehicle"]

    def login_as(self, student_id):
        with self.client.session_transaction() as sess:
            sess["student_id"] = student_id

    def put(self, vehicle_id, plate, province):
        return self.client.put(
            f"/api/vehicles/{vehicle_id}", json={"plate": plate, "province": province}
        )

    def test_update_vehicle_success(self):
        self.login_as(self.OWNER)
        response = self.put(self.vehicle_id, "9กก 9999", "ปทุมธานี")
        self.assertEqual(response.status_code, 200, response.get_data(as_text=True))
        body = response.get_json()
        self.assertTrue(body["ok"])
        self.assertEqual(body["vehicle"]["plate"], "9กก 9999")
        self.assertEqual(body["vehicle"]["province"], "ปทุมธานี")

    def test_update_vehicle_keeps_own_plate(self):
        self.login_as(self.OWNER)
        response = self.put(self.vehicle_id, "กข 1111", "กรุงเทพมหานคร")
        self.assertEqual(response.status_code, 200, response.get_data(as_text=True))

    def test_update_vehicle_forbidden(self):
        self.login_as(self.OTHER)  # คนละคนกับเจ้าของรถ
        self.assertRejected(self.put(self.vehicle_id, "1กก 1111", "กรุงเทพมหานคร"), 403, "FORBIDDEN")

    def test_update_vehicle_duplicate_plate(self):
        self.login_as(self.OWNER)
        self.assertRejected(
            self.put(self.vehicle_id, "1กข 1234", "กรุงเทพมหานคร"), 409, "PLATE_DUPLICATE"
        )

    def test_update_vehicle_not_found(self):
        self.login_as(self.OWNER)
        self.assertRejected(self.put(99999, "1กก 1111", "กรุงเทพมหานคร"), 404, "VEHICLE_NOT_FOUND")

    def test_update_vehicle_validation_error(self):
        self.login_as(self.OWNER)
        self.assertRejected(self.put(self.vehicle_id, "", ""), 400, "VALIDATION_ERROR")

    def test_update_vehicle_unauthorized(self):
        self.assertRejected(self.put(self.vehicle_id, "1กก 1111", "กรุงเทพมหานคร"), 401, "UNAUTHORIZED")

    def test_save_rejects_plate_owned_by_another_student(self):
        response = self.client.post(
            "/api/vehicles",
            json={"student_id": "6410000003", "plate": "1กข 1234", "province": "กรุงเทพมหานคร"},
        )
        self.assertRejected(response, 409, "PLATE_DUPLICATE")

    def test_save_same_student_can_reregister_own_plate(self):
        self.save(self.OWNER, "กข 1111", "กรุงเทพมหานคร")
