"""TC-US7-03  จองโซนเต็ม  (AC3, C01)

[QA] (US1) เคส 4: ลานจอดเต็ม -> 422 ZONE_FULL, ไม่มีการเปลี่ยนแปลงใน DB
  (test_tc_us7_03_full_zone_rejects_new_booking)
  ใช้โซน B (จองให้เต็มทุกช่อง) แทนตัวอย่าง "ศกร." ในการ์ด เพราะข้อมูลตั้งต้นมีแค่โซน A/B

รันเฉพาะไฟล์นี้: python -m unittest discover -s tests -p "test_tc03_zone_full.py" -v
"""

import sqlite3
from contextlib import closing

from config import DEFAULT_ZONES
from us7_support import DAY, ReservationTestCase

ZONE_B = DEFAULT_ZONES["โซน B"]
ZONE_A = DEFAULT_ZONES["โซน A"]


class TestUS7_03_ZoneFull(ReservationTestCase):

    def _fill_zone_b(self, start="10:00", end="11:00"):
        # จองครบทุกช่องของโซน B = โซนเต็ม
        for label in ZONE_B:
            self.assertEqual(self.book(label, start, end).status_code, 201)

    def test_tc_us7_03_full_zone_rejects_new_booking(self):
        """[QA US1 เคส 4] โซนเต็ม -> 422 ZONE_FULL และ DB ไม่เปลี่ยน"""
        self.assertEqual(self.db_rows(), [], "ฐานข้อมูลต้องว่างก่อนเริ่มเทส")
        self._fill_zone_b()
        rows_when_full = self.db_rows()
        self.assertEqual(len(rows_when_full), len(ZONE_B))

        for label in ZONE_B:
            with self.subTest(slot=label):
                response = self.book(label, name="คนที่สาม")

                # 1) ได้ 422 ZONE_FULL และไม่มีการจอง/QR ใน response
                self.assertRejected(response, 422, "ZONE_FULL")
                body = response.get_json()
                for key in ("reservation", "qr_data_uri", "qr_url"):
                    self.assertNotIn(key, body)

                # 2) ไม่มีการเปลี่ยนแปลงใน DB (แถวเดิมทุกค่า ไม่มีแถวเพิ่ม)
                self.assertEqual(self.db_rows(), rows_when_full)

    def test_tc_us7_03_availability_reports_the_zone_as_full(self):
        self._fill_zone_b()

        data = self.client.get(
            "/api/availability", query_string={"date": DAY, "start": "10:00", "end": "11:00"}
        ).get_json()

        zones = {zone["id"]: zone for zone in data["zones"]}
        zone_b = zones[self.zone_id_of("B1")]
        zone_a = zones[self.zone_id_of("A1")]
        self.assertTrue(zone_b["full"])
        self.assertEqual((zone_b["free"], zone_b["total"]), (0, len(ZONE_B)))
        self.assertFalse(zone_a["full"])
        self.assertEqual((zone_a["free"], zone_a["total"]), (len(ZONE_A), len(ZONE_A)))

    def test_tc_us7_03_zone_is_only_full_for_the_booked_period(self):
        self._fill_zone_b("10:00", "11:00")

        self.assertEqual(self.book("B1", "11:00", "12:00").status_code, 201)  # ช่วงอื่นยังจองได้
        self.assertEqual(self.book("A1", "10:00", "11:00").status_code, 201)  # โซนอื่นไม่กระทบ

    def test_tc_us7_03_zone_is_full_when_partial_overlaps_cover_every_slot(self):
        """ช่องแต่ละช่องถูกจองคนละช่วงที่เหลื่อมกัน แต่ครอบช่วงที่ขอทั้งหมด = เต็ม"""
        # ช่องแรกจอง 09:00-10:30 ที่เหลือจอง 10:00-11:30 → ช่วง 10:15-10:45 ไม่มีช่องว่างเลย
        self.assertEqual(self.book(ZONE_B[0], "09:00", "10:30").status_code, 201)
        for label in ZONE_B[1:]:
            self.assertEqual(self.book(label, "10:00", "11:30").status_code, 201)

        self.assertRejected(self.book(ZONE_B[0], "10:15", "10:45"), 422, "ZONE_FULL")

    def zone_id_of(self, label):
        with closing(sqlite3.connect(self.db_path)) as conn:
            return conn.execute(
                "SELECT zone_id FROM slots WHERE label = ?", (label,)
            ).fetchone()[0]
