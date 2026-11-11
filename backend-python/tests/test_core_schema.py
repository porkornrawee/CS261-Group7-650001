"""CORE-01 (Dev 1): migration รันซ้ำได้, trigger ไม่นับแถวที่ยกเลิก, 401/403, เก็บ student_id ตอนจอง
ส่วน migration จากฐานข้อมูลเก่าและ trigger แบบละเอียดอยู่ใน test_core01.py
"""

import sqlite3
from contextlib import closing

from us7_support import ReservationTestCase
from db import connect, init_db


class CoreSchemaContractTests(ReservationTestCase):
    def setUp(self):
        super().setUp()
        self.app.secret_key = "test-only-secret"

    def login_as(self, student_id):
        with self.client.session_transaction() as user_session:
            user_session["student_id"] = student_id

    def test_init_db_can_run_again_on_existing_database(self):
        self.book("A1")
        init_db(self.db_path)
        init_db(self.db_path)
        with closing(connect(self.db_path)) as conn:
            self.assertEqual(conn.execute("SELECT COUNT(*) FROM reservations").fetchone()[0], 1)
            tables = {row[0] for row in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")}
            self.assertTrue({"reservations", "notifications", "students"} <= tables)

    def test_trigger_ignores_cancelled_and_auto_cancelled_rows(self):
        with closing(connect(self.db_path)) as conn:
            for code, status in (("PK-C1", "cancelled"), ("PK-C2", "auto_cancelled")):
                conn.execute(
                    """INSERT INTO reservations (code, slot_id, user_name, start_at, end_at, created_at, status)
                       VALUES (?, ?, 'x', '2026-10-20T10:00', '2026-10-20T11:00', '2026-10-15T12:00', ?)""",
                    (code, self.slots["A1"], status),
                )
        self.assertEqual(self.book("A1").status_code, 201)
        with closing(connect(self.db_path)) as conn, self.assertRaises(sqlite3.IntegrityError):
            conn.execute(
                """INSERT INTO reservations (code, slot_id, user_name, start_at, end_at, created_at)
                   VALUES ('PK-DUP', ?, 'x', '2026-10-20T10:30', '2026-10-20T11:30', '2026-10-15T12:00')""",
                (self.slots["A1"],),
            )

    def test_endpoints_that_need_login_return_401_without_session(self):
        for method, path in (
            ("get", "/api/me/reservations"),
            ("get", "/api/me/notifications"),
            ("post", "/api/reservations/PK-ANY/cancel"),
        ):
            with self.subTest(path=path):
                self.assertRejected(getattr(self.client, method)(path), 401, "UNAUTHORIZED")

    def test_accessing_another_students_reservation_returns_403(self):
        with closing(connect(self.db_path)) as conn:
            conn.execute("INSERT INTO students (student_id) VALUES ('A'), ('B')")
        self.login_as("A")
        code = self.book("A1").get_json()["reservation"]["code"]
        self.login_as("B")
        self.assertRejected(self.client.post(f"/api/reservations/{code}/cancel"), 403, "FORBIDDEN")

    def test_create_reservation_stores_student_id_from_session(self):
        with closing(connect(self.db_path)) as conn:
            conn.execute("INSERT INTO students (student_id) VALUES ('6500000001')")
        self.login_as("6500000001")
        response = self.client.post(
            "/api/reservations",
            json={
                "user_name": "สมชาย",
                "slot_id": self.slots["A1"],
                "date": "2026-10-20",
                "start": "10:00",
                "end": "11:00",
                "student_id": "someone-else",  # ค่าจาก client ต้องไม่มีผล
            },
        )
        self.assertEqual(response.status_code, 201, response.get_data(as_text=True))
        with closing(connect(self.db_path)) as conn:
            row = conn.execute("SELECT student_id, status FROM reservations").fetchone()
        self.assertEqual((row["student_id"], row["status"]), ("6500000001", "active"))


if __name__ == "__main__":
    import unittest
    unittest.main()