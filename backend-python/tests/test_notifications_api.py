import os
import shutil
import sys
import tempfile
import unittest
from contextlib import closing
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from db import connect


NOW = datetime(2026, 10, 20, 9, 0)


class NotificationApiTests(unittest.TestCase):
    def setUp(self):
        self.tmp_dir = tempfile.mkdtemp(prefix="parking-notification-api-")
        self.db_path = os.path.join(self.tmp_dir, "test.db")
        self.app = create_app(db_path=self.db_path, now_func=lambda: NOW)
        self.app.secret_key = "test-only-secret"
        self.client = self.app.test_client()
        with closing(connect(self.db_path)) as conn:
            conn.execute("INSERT INTO students (student_id) VALUES ('A'), ('B')")
            slots = {
                row["label"]: row["id"]
                for row in conn.execute("SELECT id, label FROM slots")
            }
            for student_id, slot in (("A", "A1"), ("B", "A2")):
                conn.execute(
                    """INSERT INTO reservations
                       (code, slot_id, user_name, start_at, end_at, created_at,
                        student_id, status)
                       VALUES (?, ?, ?, '2026-10-20T09:15', '2026-10-20T10:00',
                               '2026-10-19T10:00', ?, 'active')""",
                    (f"PK-{student_id}NOTIFY", slots[slot], student_id, student_id),
                )

    def tearDown(self):
        shutil.rmtree(self.tmp_dir, ignore_errors=True)

    def login_as(self, student_id):
        with self.client.session_transaction() as user_session:
            user_session["student_id"] = student_id

    def test_notification_endpoints_require_a_login_session(self):
        response = self.client.get("/api/me/notifications")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.get_json()["error"]["code"], "UNAUTHORIZED")
        read_response = self.client.post("/api/me/notifications/1/read")
        self.assertEqual(read_response.status_code, 401)

    def test_get_generates_due_alerts_once_and_only_returns_the_session_owner(self):
        self.login_as("A")

        first = self.client.get("/api/me/notifications?student_id=B").get_json()
        second = self.client.get("/api/me/notifications").get_json()

        self.assertTrue(first["ok"])
        self.assertEqual(len(first["notifications"]), 1)
        self.assertEqual(first["notifications"][0]["type"], "near_start")
        self.assertIn("A1", first["notifications"][0]["message"])
        self.assertEqual(len(second["notifications"]), 1)
        with closing(connect(self.db_path)) as conn:
            self.assertEqual(conn.execute("SELECT COUNT(*) FROM notifications").fetchone()[0], 2)

    def test_read_is_idempotent_and_other_students_cannot_mark_it_read(self):
        self.login_as("A")
        notification = self.client.get("/api/me/notifications").get_json()["notifications"][0]
        self.login_as("B")
        forbidden = self.client.post(f"/api/me/notifications/{notification['id']}/read")
        self.assertEqual(forbidden.status_code, 403)
        self.assertEqual(forbidden.get_json()["error"]["code"], "FORBIDDEN")

        self.login_as("A")
        first = self.client.post(f"/api/me/notifications/{notification['id']}/read")
        second = self.client.post(f"/api/me/notifications/{notification['id']}/read")
        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        self.assertIsNotNone(first.get_json()["notification"]["read_at"])

    def test_read_returns_not_found_for_unknown_notification(self):
        self.login_as("A")
        response = self.client.post("/api/me/notifications/999/read")
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.get_json()["error"]["code"], "NOT_FOUND")

    def test_reservation_owner_comes_from_the_session_not_the_request_body(self):
        self.login_as("A")
        with closing(connect(self.db_path)) as conn:
            slot_id = next(
                row["id"]
                for row in conn.execute("SELECT id, label FROM slots")
                if row["label"] == "A3"
            )

        response = self.client.post(
            "/api/reservations",
            json={
                "user_name": "A",
                "slot_id": slot_id,
                "date": "2026-10-21",
                "start": "09:00",
                "end": "10:00",
                "student_id": "B",
            },
        )

        self.assertEqual(response.status_code, 201, response.get_data(as_text=True))
        code = response.get_json()["reservation"]["code"]
        with closing(connect(self.db_path)) as conn:
            stored_owner = conn.execute(
                "SELECT student_id FROM reservations WHERE code = ?", (code,)
            ).fetchone()["student_id"]
        self.assertEqual(stored_owner, "A")


if __name__ == "__main__":
    unittest.main()
