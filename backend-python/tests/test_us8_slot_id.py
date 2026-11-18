"""US8 — GET /api/me/reservations ต้องส่ง slot_id เพื่อให้ผังไฮไลต์ช่องที่จองได้

รัน: python -m unittest discover -s tests -p "test_us8_slot_id.py" -v
"""

from contextlib import closing

from db import connect
import test_tc_us5_history


class TestUS8SlotId(test_tc_us5_history.HistoryTestCase):
    def test_tc_us8_history_rows_include_slot_id_matching_the_slot_label(self):
        self.login_as("A")

        reservations = self.client.get("/api/me/reservations").get_json()["reservations"]

        with closing(connect(self.db_path)) as conn:
            ids = {r["label"]: r["id"] for r in conn.execute("SELECT id, label FROM slots")}
        self.assertTrue(reservations)
        for item in reservations:
            with self.subTest(code=item["code"]):
                self.assertIn("slot_id", item)
                self.assertEqual(item["slot_id"], ids[item["slot"]])
