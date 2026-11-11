"""US12 (Dev 1): ยกเลิกการจองอัตโนมัติเมื่อไม่มา + เช็กอิน — TC-US12-01..03

ใช้นาฬิกาที่เลื่อนได้ (ฉีดผ่าน now_func ของ create_app)
"""

import os
import shutil
import sys
import tempfile
import unittest
from contextlib import closing
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app  # noqa: E402
from config import NO_SHOW_GRACE_MIN  # noqa: E402
from db import connect  # noqa: E402
from no_show_service import sweep_no_shows  # noqa: E402

DAY = "2026-10-20"
START = datetime(2026, 10, 20, 10, 0)


class Clock:
    def __init__(self, now):
        self.now = now

    def __call__(self):
        return self.now


class NoShowTests(unittest.TestCase):
    def setUp(self):
        self.tmp_dir = tempfile.mkdtemp(prefix="parking-us12-test-")
        self.db_path = os.path.join(self.tmp_dir, "test.db")
        self.clock = Clock(datetime(2026, 10, 19, 12, 0))  # วันก่อนหน้า: จองล่วงหน้าได้
        self.app = create_app(db_path=self.db_path, now_func=self.clock)
        self.app.secret_key = "test-only-secret"
        self.client = self.app.test_client()
        with closing(connect(self.db_path)) as conn:
            conn.execute("INSERT INTO students (student_id) VALUES ('S1'), ('S2')")
            self.slots = {r["label"]: r["id"] for r in conn.execute("SELECT id, label FROM slots")}

    def tearDown(self):
        shutil.rmtree(self.tmp_dir, ignore_errors=True)

    def login_as(self, student_id):
        with self.client.session_transaction() as user_session:
            user_session["student_id"] = student_id

    def book(self, student_id, start="10:00", end="11:00", label="A1"):
        self.login_as(student_id)
        response = self.client.post("/api/reservations", json={
            "user_name": student_id, "slot_id": self.slots[label],
            "date": DAY, "start": start, "end": end,
        })
        return response

    def status_of(self, code):
        with closing(connect(self.db_path)) as conn:
            return conn.execute(
                "SELECT status, cancelled_at, checked_in_at FROM reservations WHERE code = ?", (code,)
            ).fetchone()

    def notifications(self, code):
        with closing(connect(self.db_path)) as conn:
            return conn.execute(
                """SELECT student_id, type, message FROM notifications
                   WHERE reservation_id = (SELECT id FROM reservations WHERE code = ?)""",
                (code,),
            ).fetchall()

    def at(self, hour, minute, second=0):
        self.clock.now = datetime(2026, 10, 20, hour, minute, second)

    # --- TC-US12-01 -------------------------------------------------------

    def test_tc_us12_01_no_show_after_grace_is_auto_cancelled_with_notification(self):
        code = self.book("S1").get_json()["reservation"]["code"]

        self.at(10, NO_SHOW_GRACE_MIN)  # ครบ grace พอดี -> ยังไม่ยกเลิก
        self.client.get(f"/api/availability?date={DAY}&start=10:00&end=11:00")
        self.assertEqual(self.status_of(code)["status"], "active")

        self.at(10, NO_SHOW_GRACE_MIN, 1)  # เลย grace -> request ที่อ่านช่องจะ sweep ให้
        self.client.get(f"/api/availability?date={DAY}&start=10:00&end=11:00")
        row = self.status_of(code)
        self.assertEqual(row["status"], "auto_cancelled")
        self.assertEqual(row["cancelled_at"], "2026-10-20T10:15:01")

        notes = self.notifications(code)
        self.assertEqual([(n["student_id"], n["type"]) for n in notes], [("S1", "auto_cancelled")])
        self.assertIn("A1", notes[0]["message"])

        # sweep ซ้ำต้องไม่สร้างแจ้งเตือนซ้ำ
        with closing(connect(self.db_path)) as conn:
            self.assertEqual(sweep_no_shows(conn, self.clock.now), 0)
        self.assertEqual(len(self.notifications(code)), 1)

    def test_user_sees_auto_cancel_in_history_and_notifications(self):
        code = self.book("S1").get_json()["reservation"]["code"]
        self.at(10, 30)
        self.login_as("S1")
        history = self.client.get("/api/me/reservations?status=auto_cancelled").get_json()
        self.assertEqual([r["code"] for r in history["reservations"]], [code])
        notes = self.client.get("/api/me/notifications").get_json()["notifications"]
        self.assertEqual([n["type"] for n in notes], ["auto_cancelled"])

    # --- TC-US12-02 -------------------------------------------------------

    def test_tc_us12_02_check_in_within_grace_prevents_auto_cancel(self):
        code = self.book("S1").get_json()["reservation"]["code"]

        self.at(10, 10)
        response = self.client.post(f"/api/reservations/{code.lower()}/check-in")
        self.assertEqual(response.status_code, 200, response.get_data(as_text=True))
        self.assertEqual(response.get_json()["reservation"]["status"], "checked_in")

        self.at(10, 45)
        self.client.get(f"/api/availability?date={DAY}&start=10:00&end=11:00")
        row = self.status_of(code)
        self.assertEqual(row["status"], "checked_in")
        self.assertEqual(row["checked_in_at"], "2026-10-20T10:10:00")
        self.assertEqual(self.notifications(code), [])

    def test_check_in_outside_window_is_rejected(self):
        code = self.book("S1").get_json()["reservation"]["code"]

        self.at(9, 30)  # เร็วเกินไป (เปิดเช็กอิน 15 นาทีก่อนเริ่ม)
        early = self.client.post(f"/api/reservations/{code}/check-in")
        self.assertEqual(early.status_code, 422)
        self.assertEqual(early.get_json()["error"]["code"], "NOT_IN_GRACE")

        self.at(10, 20)  # เลย grace
        late = self.client.post(f"/api/reservations/{code}/check-in")
        self.assertEqual(late.status_code, 422)
        self.assertEqual(late.get_json()["error"]["code"], "NOT_IN_GRACE")
        self.assertEqual(self.status_of(code)["status"], "auto_cancelled")

    def test_check_in_twice_or_unknown_code(self):
        code = self.book("S1").get_json()["reservation"]["code"]
        self.at(10, 0)
        self.assertEqual(self.client.post(f"/api/reservations/{code}/check-in").status_code, 200)
        again = self.client.post(f"/api/reservations/{code}/check-in")
        self.assertEqual(again.status_code, 409)
        self.assertEqual(again.get_json()["error"]["code"], "NOT_ACTIVE")
        missing = self.client.post("/api/reservations/PK-NOPE0000/check-in")
        self.assertEqual(missing.status_code, 404)

    # --- TC-US12-03 -------------------------------------------------------

    def test_tc_us12_03_slot_is_free_and_bookable_after_auto_cancel(self):
        code = self.book("S1").get_json()["reservation"]["code"]
        self.at(10, 20)

        availability = self.client.get(f"/api/availability?date={DAY}&start=10:30&end=11:00").get_json()
        slot = next(s for s in availability["slots"] if s["id"] == self.slots["A1"])
        self.assertEqual(slot["status"], "free")

        response = self.book("S2", start="10:30", end="11:00")
        self.assertEqual(response.status_code, 201, response.get_data(as_text=True))
        self.assertEqual(self.status_of(code)["status"], "auto_cancelled")

    def test_zones_endpoint_exposes_grace_minutes(self):
        layout = self.client.get("/api/zones").get_json()
        self.assertEqual(layout["grace_min"], NO_SHOW_GRACE_MIN)


if __name__ == "__main__":
    unittest.main()