"""TC-US7-02  จองซ้ำช่องที่ถูกจองแล้ว / 2 คนพร้อมกันสำเร็จ 1  (AC2, NFR02)
"""

import sqlite3
import threading
from contextlib import closing

from us7_support import DAY, ReservationTestCase


class TestUS7_02_NoDoubleBooking(ReservationTestCase):

    def test_tc_us7_02_same_slot_same_time_is_rejected(self):
        self.assertEqual(self.book("A1").status_code, 201)

        second = self.book("A1", name="คนที่สอง")

        self.assertRejected(second, 409, "SLOT_CONFLICT")
        self.assertEqual(len(self.db_rows()), 1)  # ไม่มีแถวที่ 2 ในฐานข้อมูล

    def test_tc_us7_02_overlapping_time_ranges_are_rejected(self):
        self.assertEqual(self.book("A1", "10:00", "11:00").status_code, 201)
        for start, end in [("10:30", "11:30"), ("09:30", "10:30"), ("10:15", "10:45"), ("09:00", "12:00")]:
            with self.subTest(start=start, end=end):
                self.assertRejected(self.book("A1", start, end), 409, "SLOT_CONFLICT")
        self.assertEqual(len(self.db_rows()), 1)

    def test_tc_us7_02_adjacent_times_and_other_slots_are_allowed(self):
        """ช่วงที่ต่อกันพอดี และช่องอื่นในเวลาเดียวกัน ต้องจองได้ (กันตรวจเข้มเกินไป)"""
        self.assertEqual(self.book("A1", "10:00", "11:00").status_code, 201)
        self.assertEqual(self.book("A1", "11:00", "12:00").status_code, 201)
        self.assertEqual(self.book("A1", "09:00", "10:00").status_code, 201)
        self.assertEqual(self.book("A2", "10:00", "11:00").status_code, 201)
        self.assertEqual(len(self.db_rows()), 4)

    def _race(self, label, people, date):
        """ให้ `people` คนยิงจองช่องเดียวกัน เวลาเดียวกัน พร้อมกันที่เส้นสตาร์ท"""
        start_line = threading.Barrier(people)
        outcomes = [None] * people

        def worker(index):
            client = self.app.test_client()  # คนละ client = คนละ request/คนละ connection
            start_line.wait(timeout=10)
            response = self.book(label, date=date, name=f"ผู้ใช้ {index + 1}", client=client)
            body = response.get_json()
            outcomes[index] = (
                response.status_code,
                None if body["ok"] else body["error"]["code"],
            )

        threads = [threading.Thread(target=worker, args=(i,)) for i in range(people)]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join(timeout=30)
            self.assertFalse(thread.is_alive(), "request ค้างเกินเวลา")
        return outcomes

    def test_tc_us7_02_two_users_at_the_same_moment_exactly_one_succeeds(self):
        """2 คนกดจองช่องเดียวกันพร้อมกัน -> สำเร็จ 1 ล้มเหลว 1 (ทดสอบซ้ำ 15 รอบเพื่อจับ race)"""
        for round_no in range(15):
            date = f"2026-11-{round_no + 1:02d}"
            with self.subTest(round=round_no + 1):
                outcomes = self._race("A1", 2, date)
                self.assertEqual(sorted(o[0] for o in outcomes), [201, 409], outcomes)
                self.assertIn((409, "SLOT_CONFLICT"), outcomes)
        self.assertEqual(len(self.db_rows()), 15)  # วันละ 1 แถว ไม่มีแถวซ้ำ

    def test_tc_us7_02_ten_users_at_the_same_moment_exactly_one_succeeds(self):
        outcomes = self._race("A2", 10, DAY)
        self.assertEqual([o[0] for o in outcomes].count(201), 1, outcomes)
        self.assertEqual([o[0] for o in outcomes].count(409), 9, outcomes)
        self.assertEqual(len(self.db_rows()), 1)

    def test_tc_us7_02_database_itself_refuses_overlap_even_if_app_check_is_bypassed(self):
        """ด่านสุดท้ายที่ฐานข้อมูล: INSERT ตรง ๆ ที่ซ้อนเวลาต้องถูกปฏิเสธ"""
        sql = (
            "INSERT INTO reservations (code, slot_id, user_name, start_at, end_at, created_at) "
            "VALUES (?, ?, 'x', ?, ?, '2026-10-15T12:00:00')"
        )
        slot_id = self.slots["A1"]
        with closing(sqlite3.connect(self.db_path, isolation_level=None)) as conn:
            conn.execute(sql, ("PK-AAAAAAA1", slot_id, f"{DAY}T10:00", f"{DAY}T11:00"))
            with self.assertRaises(sqlite3.IntegrityError) as caught:
                conn.execute(sql, ("PK-AAAAAAA2", slot_id, f"{DAY}T10:30", f"{DAY}T11:30"))
        self.assertIn("SLOT_CONFLICT", str(caught.exception))
