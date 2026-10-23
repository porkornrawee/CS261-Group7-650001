import os
import sqlite3
import tempfile
import sys
import unittest
from contextlib import closing

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from booking_service import _slot_is_booked
from db import connect, init_db


class CoreSchemaTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
        self.tmp.close()
        self.path = self.tmp.name

    def tearDown(self):
        os.unlink(self.path)

    def _create_legacy_database(self):
        conn = sqlite3.connect(self.path)
        conn.executescript(
            """
            CREATE TABLE zones (id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL);
            CREATE TABLE slots (
                id INTEGER PRIMARY KEY, zone_id INTEGER NOT NULL, label TEXT UNIQUE NOT NULL
            );
            CREATE TABLE reservations (
                id INTEGER PRIMARY KEY, code TEXT UNIQUE NOT NULL,
                slot_id INTEGER NOT NULL, user_name TEXT NOT NULL,
                start_at TEXT NOT NULL, end_at TEXT NOT NULL, created_at TEXT NOT NULL
            );
            INSERT INTO zones VALUES (1, 'โซน A');
            INSERT INTO slots VALUES (1, 1, 'A1');
            INSERT INTO reservations VALUES
                (1, 'PK-LEGACY1', 1, 'Legacy student', '2026-10-20T09:00',
                 '2026-10-20T10:00', '2026-10-19T10:00');
            """
        )
        conn.close()

    def test_init_db_migrates_legacy_rows_idempotently_and_installs_core_tables(self):
        self._create_legacy_database()

        init_db(self.path)
        init_db(self.path)

        with closing(connect(self.path)) as conn:
            columns = {
                row["name"]: row for row in conn.execute("PRAGMA table_info(reservations)")
            }
            self.assertTrue({"student_id", "status", "cancelled_at", "checked_in_at"}.issubset(columns))
            row = conn.execute("SELECT code, student_id, status FROM reservations").fetchone()
            self.assertEqual(
                (row["code"], row["student_id"], row["status"]),
                ("PK-LEGACY1", None, "active"),
            )
            self.assertIsNotNone(
                conn.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='notifications'").fetchone()
            )
            unique_pairs = []
            for index in conn.execute("PRAGMA index_list(notifications)"):
                if index["unique"]:
                    unique_pairs.append(
                        tuple(row["name"] for row in conn.execute(f"PRAGMA index_info('{index['name']}')"))
                    )
            self.assertIn(("reservation_id", "type"), unique_pairs)
            trigger = conn.execute(
                "SELECT sql FROM sqlite_master WHERE type='trigger' AND name='trg_no_overlapping_reservation'"
            ).fetchone()["sql"]
            self.assertIn("auto_cancelled", trigger)
            self.assertEqual(conn.execute("SELECT COUNT(*) FROM slots").fetchone()[0], 1)

    def test_cancelled_reservation_releases_the_slot_for_a_new_booking(self):
        init_db(self.path)
        with closing(connect(self.path)) as conn:
            conn.execute("INSERT INTO students (student_id) VALUES ('S1')")
            slot_id = conn.execute("SELECT id FROM slots WHERE label='A1'").fetchone()[0]
            conn.execute(
                """INSERT INTO reservations
                   (code, slot_id, user_name, start_at, end_at, created_at, student_id, status)
                   VALUES ('PK-CANCEL01', ?, 'S1', '2026-10-20T09:00', '2026-10-20T10:00',
                           '2026-10-19T10:00', 'S1', 'cancelled')""",
                (slot_id,),
            )
            self.assertFalse(
                _slot_is_booked(
                    conn, slot_id, "2026-10-20T09:00", "2026-10-20T10:00"
                )
            )
            conn.execute(
                """INSERT INTO reservations
                   (code, slot_id, user_name, start_at, end_at, created_at, student_id, status)
                   VALUES ('PK-ACTIVE01', ?, 'S1', '2026-10-20T09:00', '2026-10-20T10:00',
                           '2026-10-19T10:00', 'S1', 'active')""",
                (slot_id,),
            )
            self.assertTrue(
                _slot_is_booked(
                    conn, slot_id, "2026-10-20T09:00", "2026-10-20T10:00"
                )
            )
            with self.assertRaises(sqlite3.IntegrityError):
                conn.execute(
                    """INSERT INTO reservations
                       (code, slot_id, user_name, start_at, end_at, created_at, student_id, status)
                       VALUES ('PK-ACTIVE02', ?, 'S1', '2026-10-20T09:30', '2026-10-20T10:30',
                               '2026-10-19T10:00', 'S1', 'active')""",
                    (slot_id,),
                )


if __name__ == "__main__":
    unittest.main()
