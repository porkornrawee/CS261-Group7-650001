"""PUT /api/vehicles/<id>  แก้ไขทะเบียนรถ (US1)

รัน: python -m unittest discover -s tests -p "test_vehicle_update.py" -v
"""

from us7_support import ReservationTestCase


class TestVehicleUpdate(ReservationTestCase):
    def setUp(self):
        super().setUp()
        self.app.secret_key = "test-only-secret"
        self.mine = self.save("6410000001", "1กข 1234", "กรุงเทพมหานคร")
        self.other = self.save("6410000002", "2ขค 5678", "กรุงเทพมหานคร")

    def save(self, student_id, plate, province):
        self.act_as(student_id)
        response = self.client.post(
            "/api/vehicles",
            json={"student_id": student_id, "plate": plate, "province": province},
        )
        self.assertEqual(response.status_code, 201, response.get_data(as_text=True))
        return response.get_json()["vehicle"]

    def login_as(self, student_id):
        with self.client.session_transaction() as user_session:
            user_session["student_id"] = student_id

    def update(self, vehicle_id, **body):
        return self.client.put(f"/api/vehicles/{vehicle_id}", json=body)

    def test_owner_can_update_plate_and_province(self):
        self.login_as("6410000001")
        response = self.update(self.mine["id"], plate="3งจ 9999", province="เชียงใหม่")
        self.assertEqual(response.status_code, 200, response.get_data(as_text=True))
        vehicle = response.get_json()["vehicle"]
        self.assertEqual(vehicle["id"], self.mine["id"])
        self.assertEqual(vehicle["plate"], "3งจ 9999")
        self.assertEqual(vehicle["province"], "เชียงใหม่")

    def test_requires_login(self):
        self.client.post("/api/auth/logout")  # ทดสอบแบบไม่ล็อกอิน
        self.assertEqual(self.update(self.mine["id"], plate="3งจ 9999", province="x").status_code, 401)

    def test_other_student_cannot_update(self):
        self.login_as("6410000002")
        response = self.update(self.mine["id"], plate="3งจ 9999", province="เชียงใหม่")
        self.assertRejected(response, 403, "FORBIDDEN")

    def test_unknown_vehicle_returns_404(self):
        self.login_as("6410000001")
        self.assertRejected(self.update(9999, plate="3งจ 9999", province="เชียงใหม่"), 404, "VEHICLE_NOT_FOUND")

    def test_rejects_missing_fields(self):
        self.login_as("6410000001")
        self.assertRejected(self.update(self.mine["id"], plate="3งจ 9999"), 400, "VALIDATION_ERROR")
        self.assertRejected(self.update(self.mine["id"], province="เชียงใหม่"), 400, "VALIDATION_ERROR")

    def test_rejects_invalid_plate_format(self):
        self.login_as("6410000001")
        self.assertRejected(self.update(self.mine["id"], plate="ABC 123", province="เชียงใหม่"), 400, "INVALID_PLATE")

    def test_rejects_plate_used_by_someone_else(self):
        self.login_as("6410000001")
        response = self.update(self.mine["id"], plate=self.other["plate"], province=self.other["province"])
        self.assertRejected(response, 409, "PLATE_DUPLICATE")

    def test_can_resubmit_own_plate_unchanged(self):
        self.login_as("6410000001")
        response = self.update(self.mine["id"], plate=self.mine["plate"], province=self.mine["province"])
        self.assertEqual(response.status_code, 200, response.get_data(as_text=True))

    def test_failed_update_leaves_vehicle_unchanged(self):
        self.login_as("6410000001")
        self.update(self.mine["id"], plate=self.other["plate"], province=self.other["province"])
        again = self.save("6410000001", self.mine["plate"], self.mine["province"])
        self.assertEqual(again["plate"], self.mine["plate"])
