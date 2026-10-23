import os
import sqlite3
import sys
import tempfile
import unittest
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from notification_service import generate_due_notifications


class NotificationServiceTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
        self.tmp.close()
        self.conn = sqlite3.connect(self.tmp.name)
        self.conn.row_factory = sqlite3.Row
        self.conn.executescript(
            """
            CREATE TABLE slots (id INTEGER PRIMARY KEY, label TEXT NOT NULL);
            CREATE TABLE reservations (
                id INTEGER PRIMARY KEY, student_id TEXT NOT NULL,
                slot_id INTEGER NOT NULL, status TEXT NOT NULL,
                start_at TEXT NOT NULL, end_at TEXT NOT NULL
            );
            CREATE TABLE notifications (
                id INTEGER PRIMARY KEY, student_id TEXT NOT NULL,
                reservation_id INTEGER NOT NULL, type TEXT NOT NULL,
                message TEXT NOT NULL, created_at TEXT NOT NULL, read_at TEXT,
                UNIQUE (reservation_id, type)
            );
            INSERT INTO slots VALUES (1, 'A1');
            INSERT INTO reservations VALUES
                (1, 'student-1', 1, 'active', '2026-10-20T09:45', '2026-10-20T10:30'),
                (2, 'student-1', 1, 'cancelled', '2026-10-20T11:00', '2026-10-20T12:00'),
                (3, 'student-2', 1, 'active', '2026-10-20T13:00', '2026-10-20T14:00'),
                (4, 'student-1', 1, 'active', '2026-10-20T09:00', '2026-10-20T09:45');
            """
        )

    def tearDown(self):
        self.conn.close()
        os.unlink(self.tmp.name)

    def test_creates_due_start_expiry_and_cancel_notifications(self):
        created = generate_due_notifications(
            self.conn, datetime(2026, 10, 20, 9, 30)
        )

        rows = self.conn.execute(
            "SELECT reservation_id, type, message FROM notifications ORDER BY reservation_id, type"
        ).fetchall()
        self.assertEqual(created, 3)
        self.assertEqual(
            {(row["reservation_id"], row["type"]) for row in rows},
            {(1, "near_start"), (2, "cancelled"), (4, "near_expiry")},
        )
        self.assertTrue(all("A1" in row["message"] for row in rows))

    def test_does_not_create_before_due_time_or_for_completed_reservations(self):
        self.conn.execute("UPDATE reservations SET status = 'completed' WHERE id IN (1, 2)")
        self.assertEqual(
            generate_due_notifications(self.conn, datetime(2026, 10, 20, 8, 0)), 0
        )
        self.assertEqual(
            self.conn.execute("SELECT COUNT(*) FROM notifications").fetchone()[0], 0
        )

    def test_repeated_calls_do_not_duplicate_reservation_type_pairs(self):
        now = datetime(2026, 10, 20, 9, 30)
        self.assertEqual(generate_due_notifications(self.conn, now), 3)
        self.assertEqual(generate_due_notifications(self.conn, now), 0)
        self.assertEqual(
            self.conn.execute("SELECT COUNT(*) FROM notifications").fetchone()[0], 3
        )


if __name__ == "__main__":
    unittest.main()
