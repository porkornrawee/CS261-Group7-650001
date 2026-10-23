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


class HistoryTestCase(unittest.TestCase):
    def setUp(self):
        self.tmp_dir = tempfile.mkdtemp(prefix="parking-history-test-")
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
            rows = [
                ("PK-A-COMP", "A", "completed", "08:00", "08:30", "A1"),
                ("PK-A-CANCEL", "A", "cancelled", "10:00", "11:00", "A2"),
                ("PK-A-AUTO", "A", "auto_cancelled", "12:00", "13:00", "A3"),
                ("PK-A-ACTIVE", "A", "active", "08:00", "08:30", "A4"),
                ("PK-B-COMP", "B", "completed", "07:00", "08:00", "B1"),
                ("PK-A-CHECKED", "A", "checked_in", "08:00", "08:50", "B2"),
            ]
            for code, student_id, status, start, end, label in rows:
                conn.execute(
                    """
                    INSERT INTO reservations
                        (code, slot_id, user_name, start_at, end_at, created_at,
                         student_id, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        code,
                        slots[label],
                        student_id,
                        f"2026-10-20T{start}",
                        f"2026-10-20T{end}",
                        "2026-10-19T12:00",
                        student_id,
                        status,
                    ),
                )

    def tearDown(self):
        shutil.rmtree(self.tmp_dir, ignore_errors=True)

    def login_as(self, student_id):
        with self.client.session_transaction() as user_session:
            user_session["student_id"] = student_id

    def test_tc_us5_01_returns_only_the_logged_in_students_reservations(self):
        self.login_as("A")

        response = self.client.get("/api/me/reservations")

        self.assertEqual(response.status_code, 200, response.get_data(as_text=True))
        body = response.get_json()
        self.assertTrue(body["ok"])
        self.assertEqual(
            {item["code"] for item in body["reservations"]},
            {"PK-A-COMP", "PK-A-CANCEL", "PK-A-AUTO", "PK-A-ACTIVE", "PK-A-CHECKED"},
        )
        active = next(item for item in body["reservations"] if item["code"] == "PK-A-ACTIVE")
        self.assertEqual(active["status"], "completed")

    def test_tc_us5_02_filters_completed_cancelled_and_auto_cancelled(self):
        self.login_as("A")

        completed = self.client.get("/api/me/reservations?status=completed").get_json()
        cancelled = self.client.get("/api/me/reservations?status=cancelled").get_json()
        auto_cancelled = self.client.get(
            "/api/me/reservations?status=auto_cancelled"
        ).get_json()

        self.assertEqual(
            {item["code"] for item in completed["reservations"]},
            {"PK-A-COMP", "PK-A-ACTIVE", "PK-A-CHECKED"},
        )
        self.assertEqual(
            [item["status"] for item in completed["reservations"]],
            ["completed", "completed", "completed"],
        )
        self.assertEqual(
            [item["code"] for item in cancelled["reservations"]], ["PK-A-CANCEL"]
        )
        self.assertEqual(
            [item["code"] for item in auto_cancelled["reservations"]], ["PK-A-AUTO"]
        )

    def test_tc_us5_03_query_cannot_select_another_student_and_requires_login(self):
        self.login_as("A")

        response = self.client.get("/api/me/reservations?student_id=B")
        codes = {item["code"] for item in response.get_json()["reservations"]}

        self.assertEqual(response.status_code, 200)
        self.assertNotIn("PK-B-COMP", codes)
        self.assertEqual(len(codes), 5)

        with self.client.session_transaction() as user_session:
            user_session.clear()
        unauthorized = self.client.get("/api/me/reservations")
        self.assertEqual(unauthorized.status_code, 401)
        self.assertEqual(unauthorized.get_json()["error"]["code"], "UNAUTHORIZED")


if __name__ == "__main__":
    unittest.main()
