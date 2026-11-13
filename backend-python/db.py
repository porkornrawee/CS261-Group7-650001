"""ชั้นฐานข้อมูล (SQLite): สร้างตาราง, ใส่ข้อมูลตั้งต้น, เปิด connection

หมายเหตุสำคัญเรื่องการจองพร้อมกัน (NFR02)
- ทุก request ใช้ connection ของตัวเอง และฝั่ง service จะเปิด transaction แบบ
  BEGIN IMMEDIATE เพื่อ "ล็อกการเขียน" ก่อนตรวจเงื่อนไข จึงไม่มีทางที่ 2 คนจะผ่านการตรวจ
  ในช่องและเวลาเดียวกันได้พร้อมกัน
- เพิ่ม TRIGGER ที่ฐานข้อมูลอีกชั้นหนึ่ง เป็นด่านสุดท้าย: ต่อให้โค้ดชั้นบนผิดพลาด
  ฐานข้อมูลก็ไม่ยอมให้บันทึกช่วงเวลาซ้อนกันในช่องเดียวกัน
"""

import os
import sqlite3
from datetime import datetime

from werkzeug.security import generate_password_hash

from config import DEFAULT_ZONES, TEST_ACCOUNT

# pbkdf2 ใช้ได้ทุกเวอร์ชันของ Python (scrypt ต้องมี OpenSSL ที่รองรับ)
PASSWORD_HASH_METHOD = "pbkdf2:sha256"

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

CREATE TABLE IF NOT EXISTS students (
    student_id TEXT PRIMARY KEY,
    name       TEXT,
    email      TEXT UNIQUE
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

-- US11: บัญชีเข้าสู่ระบบ (ยังไม่มีบัญชีจริงจาก reg) เก็บเฉพาะ hash ห้ามเก็บรหัสผ่านตรง ๆ
CREATE TABLE IF NOT EXISTS accounts (
    student_id    TEXT PRIMARY KEY REFERENCES students(student_id),
    email         TEXT,
    phone         TEXT,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL
);

-- รถที่ลงทะเบียน: 1 นักศึกษา = 1 คัน (ลงซ้ำ = แทนที่ทะเบียนเดิม)
CREATE TABLE IF NOT EXISTS vehicles (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id  TEXT NOT NULL UNIQUE,
    vehicle_type TEXT NOT NULL DEFAULT 'car',
    plate       TEXT NOT NULL,
    province    TEXT NOT NULL,
    created_at  TEXT NOT NULL,
    UNIQUE(plate, province)
);
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
    """Create the base schema and apply repeatable CORE-01 migrations."""
    conn = connect(path)
    try:
        conn.execute("PRAGMA journal_mode = WAL")  # อ่านได้ระหว่างที่มีคนกำลังเขียน
        conn.executescript(SCHEMA)

        reservation_columns = {
            row["name"] for row in conn.execute("PRAGMA table_info(reservations)")
        }
        migrations = (
            ("student_id", "TEXT REFERENCES students(student_id)"),
            (
                "status",
                "TEXT NOT NULL DEFAULT 'active' CHECK (status IN "
                "('active', 'checked_in', 'completed', 'cancelled', 'auto_cancelled'))",
            ),
            ("cancelled_at", "TEXT"),
            ("checked_in_at", "TEXT"),
            ("plate", "TEXT"),
            ("vehicle_type", "TEXT"),
        )
        for column, definition in migrations:
            if column not in reservation_columns:
                conn.execute(
                    f"ALTER TABLE reservations ADD COLUMN {column} {definition}"
                )

        student_columns = {
            row["name"] for row in conn.execute("PRAGMA table_info(students)")
        }
        for column in ("faculty", "verified_at"):
            if column not in student_columns:
                conn.execute(f"ALTER TABLE students ADD COLUMN {column} TEXT")

        vehicle_columns = {
            row["name"] for row in conn.execute("PRAGMA table_info(vehicles)")
        }
        if "vehicle_type" not in vehicle_columns:
            conn.execute(
                "ALTER TABLE vehicles ADD COLUMN vehicle_type TEXT NOT NULL DEFAULT 'car'"
            )

        # US2: accounts เก็บอีเมล/เบอร์โทรของสมาชิกที่ลงทะเบียน (DB เก่าไม่มีสองคอลัมน์นี้)
        account_columns = {
            row["name"] for row in conn.execute("PRAGMA table_info(accounts)")
        }
        for column in ("email", "phone"):
            if column not in account_columns:
                conn.execute(f"ALTER TABLE accounts ADD COLUMN {column} TEXT")
        conn.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_email ON accounts (email)"
        )

        # DB เก่าที่มีทะเบียนซ้ำอยู่แล้วจะสร้าง unique index ไม่ได้ (IntegrityError)
        # ข้ามไปก่อนให้เซิร์ฟเวอร์ยังเปิดได้ — vehicle_service ยังกันทะเบียนซ้ำที่ระดับแอปอยู่
        try:
            conn.execute(
                "CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicles_plate_province ON vehicles (plate, province)"
            )
        except (sqlite3.OperationalError, sqlite3.IntegrityError):
            pass

        conn.execute(
            """CREATE INDEX IF NOT EXISTS idx_reservations_student_start
               ON reservations (student_id, start_at DESC)"""
        )
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS notifications (
                id             INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id     TEXT NOT NULL REFERENCES students(student_id),
                reservation_id INTEGER NOT NULL REFERENCES reservations(id),
                type           TEXT NOT NULL CHECK (type IN (
                    'near_start', 'near_expiry', 'cancelled', 'auto_cancelled', 'zone_full'
                )),
                message        TEXT NOT NULL,
                created_at     TEXT NOT NULL,
                read_at        TEXT,
                UNIQUE (reservation_id, type)
            );
            CREATE INDEX IF NOT EXISTS idx_notifications_student_created
                ON notifications (student_id, created_at DESC, id DESC);
            DROP TRIGGER IF EXISTS trg_no_overlapping_reservation;
            CREATE TRIGGER trg_no_overlapping_reservation
            BEFORE INSERT ON reservations
            WHEN COALESCE(NEW.status, 'active') NOT IN ('cancelled', 'auto_cancelled')
             AND EXISTS (
                SELECT 1 FROM reservations r
                WHERE r.slot_id = NEW.slot_id
                  AND COALESCE(r.status, 'active') NOT IN ('cancelled', 'auto_cancelled')
                  AND r.start_at < NEW.end_at
                  AND r.end_at > NEW.start_at
             )
            BEGIN
                SELECT RAISE(ABORT, 'SLOT_CONFLICT');
            END;
            """
        )
        _seed_test_account(conn)
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


def create_account(conn, student_id, password, name=None, now=None):
    """สร้าง/แทนที่บัญชี (ใช้ตอน seed และในเทส) — เก็บเฉพาะ password hash"""
    created_at = (now or datetime.now()).isoformat(timespec="seconds")
    conn.execute(
        """INSERT INTO students (student_id, name) VALUES (?, ?)
           ON CONFLICT(student_id) DO UPDATE SET name = COALESCE(students.name, excluded.name)""",
        (student_id, name),
    )
    conn.execute(
        """INSERT INTO accounts (student_id, password_hash, created_at) VALUES (?, ?, ?)
           ON CONFLICT(student_id) DO UPDATE SET password_hash = excluded.password_hash""",
        (student_id, generate_password_hash(password, method=PASSWORD_HASH_METHOD), created_at),
    )


def _seed_test_account(conn):
    """US11: ใส่บัญชีทดสอบ 1 บัญชีเมื่อยังไม่มีบัญชีใดเลย (ปิดด้วย SEED_TEST_ACCOUNT=0)"""
    if os.environ.get("SEED_TEST_ACCOUNT", "1") == "0":
        return
    if conn.execute("SELECT COUNT(*) FROM accounts").fetchone()[0]:
        return
    create_account(
        conn,
        TEST_ACCOUNT["student_id"],
        TEST_ACCOUNT["password"],
        TEST_ACCOUNT["name"],
    )