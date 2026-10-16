"""TC-US7-03  จองโซนเต็ม  (AC3, C01)
"""

import sqlite3
from contextlib import closing

from us7_support import DAY, ReservationTestCase


class TestUS7_03_ZoneFull(ReservationTestCase):

    def _fill_zone_b(self, start="10:00", end="11:00"):
        # โซน B มี 2 ช่อง (B1, B2) -> จองครบทั้งสองช่อง = โซนเต็ม
        self.assertEqual(self.book("B1", start, end).status_code, 201)
        self.assertEqual(self.book("B2", start, end).status_code, 201)

    def test_tc_us7_03_full_zone_rejects_new_booking(self):
        self._fill_zone_b()

        for label in ("B1", "B2"):
            with self.subTest(slot=label):
                self.assertRejected(self.book(label), 409, "ZONE_FULL")
        self.assertEqual(len(self.db_rows()), 2)  # ไม่มีการจองเพิ่ม

    def test_tc_us7_03_availability_reports_the_zone_as_full(self):
        self._fill_zone_b()

        data = self.client.get(
            "/api/availability", query_string={"date": DAY, "start": "10:00", "end": "11:00"}
        ).get_json()

        zones = {zone["id"]: zone for zone in data["zones"]}
        zone_b = zones[self.zone_id_of("B1")]
        zone_a = zones[self.zone_id_of("A1")]
        self.assertTrue(zone_b["full"])
        self.assertEqual((zone_b["free"], zone_b["total"]), (0, 2))
        self.assertFalse(zone_a["full"])
        self.assertEqual((zone_a["free"], zone_a["total"]), (4, 4))

    def test_tc_us7_03_zone_is_only_full_for_the_booked_period(self):
        self._fill_zone_b("10:00", "11:00")

        self.assertEqual(self.book("B1", "11:00", "12:00").status_code, 201)  # ช่วงอื่นยังจองได้
        self.assertEqual(self.book("A1", "10:00", "11:00").status_code, 201)  # โซนอื่นไม่กระทบ

    def test_tc_us7_03_zone_is_full_when_partial_overlaps_cover_every_slot(self):
        """ช่องแต่ละช่องถูกจองคนละช่วงที่เหลื่อมกัน แต่ครอบช่วงที่ขอทั้งหมด = เต็ม"""
        self.assertEqual(self.book("B1", "09:00", "10:30").status_code, 201)
        self.assertEqual(self.book("B2", "10:00", "11:30").status_code, 201)

        self.assertRejected(self.book("B1", "10:15", "10:45"), 409, "ZONE_FULL")

    def zone_id_of(self, label):
        with closing(sqlite3.connect(self.db_path)) as conn:
            return conn.execute(
                "SELECT zone_id FROM slots WHERE label = ?", (label,)
            ).fetchone()[0]
