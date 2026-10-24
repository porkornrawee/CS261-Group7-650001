"""Acceptance tests for US3 reservation cancellation."""

from contextlib import closing
from datetime import datetime

from us7_support import DAY, ReservationTestCase
from db import connect
from app import create_app


class ReservationCancellationTests(ReservationTestCase):
    def setUp(self):
        super().setUp()
        self.app.secret_key = "test-only-secret"
        with closing(connect(self.db_path)) as conn:
            conn.execute("INSERT INTO students (student_id) VALUES ('A'), ('B')")

    def login_as(self, student_id):
        with self.client.session_transaction() as user_session:
            user_session["student_id"] = student_id

    def book_as(self, student_id, label="A1", start="10:00", end="11:00"):
        self.login_as(student_id)
        response = self.book(label, start=start, end=end)
        self.assertEqual(response.status_code, 201, response.get_data(as_text=True))
        return response.get_json()["reservation"]["code"]

    def cancel(self, code):
        return self.client.post(f"/api/reservations/{code}/cancel")

    def test_tc_us3_01_cancels_reservation_and_creates_notification(self):
        code = self.book_as("A")

        response = self.cancel(code)

        self.assertEqual(response.status_code, 200, response.get_data(as_text=True))
        self.assertTrue(response.get_json()["ok"])
        self.assertEqual(response.get_json()["reservation"]["status"], "cancelled")
        with closing(connect(self.db_path)) as conn:
            reservation = conn.execute(
                "SELECT status, cancelled_at FROM reservations WHERE code = ?",
                (code,),
            ).fetchone()
            notification = conn.execute(
                """SELECT student_id, type, message FROM notifications
                   WHERE reservation_id = (
                       SELECT id FROM reservations WHERE code = ?
                   )""",
                (code,),
            ).fetchone()

        self.assertEqual(reservation["status"], "cancelled")
        self.assertIsNotNone(reservation["cancelled_at"])
        self.assertIsNotNone(notification)
        self.assertEqual(notification["student_id"], "A")
        self.assertEqual(notification["type"], "cancelled")
        self.assertIn("A1", notification["message"])

    def test_tc_us3_02_rejects_cancellation_ten_minutes_before_start(self):
        code = self.book_as("A")
        self.app = create_app(
            db_path=self.db_path,
            now_func=lambda: datetime(2026, 10, 20, 9, 50),
        )
        self.app.secret_key = "test-only-secret"
        self.client = self.app.test_client()
        self.login_as("A")

        response = self.cancel(code)

        self.assertRejected(response, 422, "CANCEL_DEADLINE_PASSED")
        with closing(connect(self.db_path)) as conn:
            reservation = conn.execute(
                "SELECT status, cancelled_at FROM reservations WHERE code = ?",
                (code,),
            ).fetchone()
        self.assertEqual(reservation["status"], "active")
        self.assertIsNone(reservation["cancelled_at"])

    def test_rejects_cancelling_the_same_reservation_twice(self):
        code = self.book_as("A")
        first_response = self.cancel(code)
        self.assertEqual(first_response.status_code, 200, first_response.get_data(as_text=True))

        second_response = self.cancel(code)

        self.assertRejected(second_response, 409, "NOT_CANCELLABLE")

    def test_rejects_cancelling_another_students_reservation(self):
        code = self.book_as("B")
        self.login_as("A")

        response = self.cancel(code)

        self.assertRejected(response, 403, "FORBIDDEN")
        with closing(connect(self.db_path)) as conn:
            status = conn.execute(
                "SELECT status FROM reservations WHERE code = ?", (code,)
            ).fetchone()["status"]
        self.assertEqual(status, "active")

    def test_cancel_frees_slot_for_another_student_immediately(self):
        code = self.book_as("A")
        cancel_response = self.cancel(code)
        self.assertEqual(cancel_response.status_code, 200, cancel_response.get_data(as_text=True))

        availability = self.client.get(
            f"/api/availability?date={DAY}"
            "&start=10:00&end=11:00"
        ).get_json()
        slot = next(item for item in availability["slots"] if item["id"] == self.slots["A1"])
        self.assertEqual(slot["status"], "free")

        replacement_code = self.book_as("B")

        self.assertNotEqual(replacement_code, code)
        with closing(connect(self.db_path)) as conn:
            statuses = [
                row["status"]
                for row in conn.execute(
                    "SELECT status FROM reservations WHERE slot_id = ? ORDER BY id",
                    (self.slots["A1"],),
                )
            ]
        self.assertEqual(statuses, ["cancelled", "active"])


if __name__ == "__main__":
    import unittest

    unittest.main()
