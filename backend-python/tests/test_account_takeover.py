"""ช่องโหว่ที่เคยเจอ: ไอดีอื่นยึดบัญชี/แก้ข้อมูลของเราไม่ได้ (A: /api/members, B: /api/vehicles, C: /api/vehicles/verify)"""

import unittest
from contextlib import closing

from booking_service import BookingError
from db import connect
from us7_support import FIXED_NOW, ReservationTestCase

VICTIM = "6509650777"
MEMBER = {
    "name": "แฮกเกอร์", "phone": "0812345678", "email": "evil@example.com", "password": "attacker-pass",
    "vehicle_type": "car", "plate": "9ฮฮ 9999", "province": "กรุงเทพมหานคร",
}


class FakeTu:
    """มธ. จำลอง: รู้จักเฉพาะ VICTIM"""
    def verify_login(self, username, password):
        return {"student_id": username, "name": "เหยื่อ มธ."} if (username, password) == (VICTIM, "victim-pass") else None

    def get_student(self, student_id):
        if student_id == VICTIM:
            return {"name": "เหยื่อ มธ.", "faculty": "x", "email": "victim@dome.tu.ac.th"}
        raise BookingError("TU_NOT_FOUND", "ไม่พบ", 404)


class TakeoverTests(ReservationTestCase):
    def setUp(self):
        super().setUp()
        from app import create_app
        self.app = create_app(db_path=self.db_path, now_func=lambda: FIXED_NOW, tu_client=FakeTu())
        self.app.secret_key = "test-only-secret"
        self.attacker = self.app.test_client()

    def register(self, client, student_id):
        return client.post("/api/members", json={"student_id": student_id, **MEMBER})

    def seed_student(self, student_id, verified=False):
        with closing(connect(self.db_path)) as conn:
            conn.execute(
                "INSERT OR IGNORE INTO students (student_id, name, verified_at) VALUES (?, 'x', ?)",
                (student_id, "2026-10-15T12:00:00" if verified else None),
            )
            conn.commit()

    # --- A -----------------------------------------------------------------
    def test_cannot_register_with_id_of_tu_user_who_already_logged_in(self):
        victim = self.app.test_client()
        self.assertEqual(victim.post("/api/auth/login", json={"student_id": VICTIM, "password": "victim-pass"}).status_code, 200)
        response = self.register(self.attacker, VICTIM)
        self.assertRejected(response, 409, "USE_TU_LOGIN")
        login = self.attacker.post("/api/auth/login", json={"student_id": VICTIM, "password": MEMBER["password"]})
        self.assertEqual(login.status_code, 401)

    def test_cannot_pre_claim_id_that_tu_knows_but_has_not_logged_in_yet(self):
        self.seed_student(VICTIM)  # มีแถวใน students แต่ยังไม่เคย login (verified_at ว่าง)
        self.assertRejected(self.register(self.attacker, VICTIM), 409, "USE_TU_LOGIN")

    def test_registration_fails_closed_when_tu_is_down(self):
        class Down(FakeTu):
            def get_student(self, student_id):
                raise BookingError("TU_UNAVAILABLE", "ล่ม", 502)
        from app import create_app
        app = create_app(db_path=self.db_path, now_func=lambda: FIXED_NOW, tu_client=Down())
        self.seed_student("6500009999")
        self.assertRejected(self.register(app.test_client(), "6500009999"), 502, "TU_UNAVAILABLE")

    def test_external_member_not_in_tu_can_still_register(self):
        self.seed_student("6500009999")  # ไม่ใช่รหัส มธ. (FakeTu ตอบ TU_NOT_FOUND) และยังไม่เคยยืนยัน
        response = self.register(self.attacker, "6500009999")
        self.assertEqual(response.status_code, 201, response.get_data(as_text=True))

    # --- B -----------------------------------------------------------------
    def test_vehicle_save_requires_login(self):
        response = self.attacker.post("/api/vehicles", json={"student_id": VICTIM, "plate": "1กข 1111", "province": "กรุงเทพมหานคร"})
        self.assertRejected(response, 401, "UNAUTHORIZED")

    def test_cannot_save_vehicle_for_another_student(self):
        response = self.client.post(  # self.client = 6500000001
            "/api/vehicles", json={"student_id": VICTIM, "plate": "1กข 1111", "province": "กรุงเทพมหานคร"}
        )
        self.assertRejected(response, 403, "FORBIDDEN")
        with closing(connect(self.db_path)) as conn:
            self.assertEqual(conn.execute("SELECT COUNT(*) FROM vehicles WHERE student_id = ?", (VICTIM,)).fetchone()[0], 0)

    def test_save_vehicle_without_student_id_uses_logged_in_account(self):
        response = self.client.post("/api/vehicles", json={"plate": "1กข 1111", "province": "กรุงเทพมหานคร"})
        self.assertEqual(response.status_code, 201, response.get_data(as_text=True))
        self.assertEqual(response.get_json()["vehicle"]["student_id"], "6500000001")

    # --- C -----------------------------------------------------------------
    def test_verify_requires_login(self):
        response = self.attacker.post("/api/vehicles/verify", json={"student_id": VICTIM, "email": "victim@dome.tu.ac.th"})
        self.assertRejected(response, 401, "UNAUTHORIZED")

    def test_cannot_verify_another_students_id(self):
        response = self.client.post("/api/vehicles/verify", json={"student_id": VICTIM, "email": "attacker@dome.tu.ac.th"})
        self.assertRejected(response, 403, "FORBIDDEN")
        with closing(connect(self.db_path)) as conn:
            self.assertIsNone(conn.execute("SELECT 1 FROM students WHERE student_id = ?", (VICTIM,)).fetchone())


if __name__ == "__main__":
    unittest.main()
