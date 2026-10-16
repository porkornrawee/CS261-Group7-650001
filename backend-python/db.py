"""ชั้นฐานข้อมูล (SQLite): สร้างตาราง, ใส่ข้อมูลตั้งต้น, เปิด connection

หมายเหตุสำคัญเรื่องการจองพร้อมกัน (NFR02)
- ทุก request ใช้ connection ของตัวเอง และฝั่ง service จะเปิด transaction แบบ
  BEGIN IMMEDIATE เพื่อ "ล็อกการเขียน" ก่อนตรวจเงื่อนไข จึงไม่มีทางที่ 2 คนจะผ่านการตรวจ
  ในช่องและเวลาเดียวกันได้พร้อมกัน
- เพิ่ม TRIGGER ที่ฐานข้อมูลอีกชั้นหนึ่ง เป็นด่านสุดท้าย: ต่อให้โค้ดชั้นบนผิดพลาด
  ฐานข้อมูลก็ไม่ยอมให้บันทึกช่วงเวลาซ้อนกันในช่องเดียวกัน
"""

import sqlite3

from config import DEFAULT_ZONES

SCHEMA = """
CREATE TABLE IF NOT EXISTS zones (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS slots (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    zone_id INTEGER NOT NULL REFERENCES zones(id),
    label   TEXT NOT NULL UNIQUE
);

-- start_at / end_at เก็บเป็นข้อความ 'YYYY-MM-DDTHH:MM' เพื่อให้เปรียบเทียบตามตัวอักษรได้ถูกต้อง
CREATE TABLE IF NOT EXISTS reservations (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    code       TEXT NOT NULL UNIQUE,
    slot_id    INTEGER NOT NULL REFERENCES slots(id),
    user_name  TEXT NOT NULL,
    start_at   TEXT NOT NULL,
    end_at     TEXT NOT NULL,
    created_at TEXT NOT NULL,
    CHECK (end_at > start_at)
);

CREATE INDEX IF NOT EXISTS idx_reservations_slot_time
    ON reservations (slot_id, start_at, end_at);

-- ด่านสุดท้ายของ NFR02: ห้ามมีช่วงเวลาซ้อนกันในช่องเดียวกัน
-- (ช่วงที่ต่อกันพอดี เช่น 10:00-11:00 กับ 11:00-12:00 ไม่ถือว่าซ้อน)
CREATE TRIGGER IF NOT EXISTS trg_no_overlapping_reservation
BEFORE INSERT ON reservations
WHEN EXISTS (
    SELECT 1 FROM reservations r
    WHERE r.slot_id = NEW.slot_id
      AND r.start_at < NEW.end_at
      AND r.end_at   > NEW.start_at
)
BEGIN
    SELECT RAISE(ABORT, 'SLOT_CONFLICT');
END;
"""


def connect(path):
    """เปิด connection ใหม่ (1 request ต่อ 1 connection)

    isolation_level=None = ให้เราควบคุม BEGIN/COMMIT เอง
    timeout=10 = ถ้ามีคนอื่นกำลังเขียนอยู่ ให้รอคิวสูงสุด 10 วินาที
    """
    conn = sqlite3.connect(path, timeout=10, isolation_level=None)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db(path):
    """สร้างตารางและใส่โซน/ช่องจอดตั้งต้น (ทำซ้ำได้ ไม่ทับข้อมูลเดิม)"""
    conn = connect(path)
    try:
        conn.execute("PRAGMA journal_mode = WAL")  # อ่านได้ระหว่างที่มีคนกำลังเขียน
        conn.executescript(SCHEMA)
        if conn.execute("SELECT COUNT(*) FROM zones").fetchone()[0] == 0:
            for zone_name, labels in DEFAULT_ZONES.items():
                zone_id = conn.execute(
                    "INSERT INTO zones (name) VALUES (?)", (zone_name,)
                ).lastrowid
                for label in labels:
                    conn.execute(
                        "INSERT INTO slots (zone_id, label) VALUES (?, ?)",
                        (zone_id, label),
                    )
    finally:
        conn.close()
