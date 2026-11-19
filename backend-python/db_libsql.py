"""อะแดปเตอร์ให้ libsql (Turso) หน้าตาเหมือน sqlite3 ที่โค้ดส่วนอื่นใช้อยู่

ที่ต่างกันและถูกชดเชยที่นี่:
  - แถวผลลัพธ์เป็น tuple ธรรมดา -> ห่อเป็น Row ที่เรียกได้ทั้ง row["ชื่อ"], row[0], row.keys(), dict(row)
  - cursor วนลูปตรง ๆ ไม่ได้ -> รองรับ for row in cursor
  - error เป็น ValueError ทั้งหมด -> แปลงเป็น sqlite3.IntegrityError / OperationalError ให้ except เดิมยังจับได้
ตั้งค่าด้วย env: TURSO_DATABASE_URL (libsql://...) + TURSO_AUTH_TOKEN  (หรือ PARKING_DB_DRIVER=libsql ใช้ไฟล์ในเครื่องเพื่อทดสอบ)
"""
import re
import sqlite3

_OPERATIONAL = ("locked", "busy", "no such", "syntax error", "sql logic", "unable to open", "disk i/o", "readonly")


def _translate(error):
    """แปลง exception ของ libsql เป็นชนิดเดียวกับที่ sqlite3 โยน"""
    text = str(error)
    if isinstance(error, (sqlite3.Error,)):
        return error
    low = text.lower()
    if "sqlite_busy" in low or "idle for too long" in low:
        return sqlite3.OperationalError("database is locked (" + text[:80] + ")")  # booking_service แปลงเป็น BUSY 503
    if any(word in low for word in _OPERATIONAL):
        return sqlite3.OperationalError(text)
    return sqlite3.IntegrityError(text)  # constraint ทั้งหลาย และ RAISE(ABORT, ...) จาก trigger


_NAMED = re.compile(r":(\w+)")


def _positional(sql, params):
    """libsql รับเฉพาะพารามิเตอร์แบบลำดับ (? + tuple/list) -> แปลง :ชื่อ + dict ให้เป็นแบบลำดับ (ไม่แตะข้อความในเครื่องหมาย ' ')"""
    if not isinstance(params, dict):
        return sql, tuple(params) if not isinstance(params, (tuple, list)) else params
    values = []
    parts = re.split(r"('(?:[^']|'')*')", sql)
    for i in range(0, len(parts), 2):  # ชิ้นคู่ = นอกเครื่องหมายคำพูด
        def swap(match):
            values.append(params[match.group(1)])
            return "?"
        parts[i] = _NAMED.sub(swap, parts[i])
    return "".join(parts), tuple(values)


class Row:
    """แถวผลลัพธ์แบบ sqlite3.Row: เข้าถึงด้วยชื่อหรือลำดับ และแปลงเป็น dict ได้"""
    __slots__ = ("_values", "_names")

    def __init__(self, names, values):
        self._names = names
        self._values = tuple(values)

    def keys(self):
        return list(self._names)

    def __getitem__(self, key):
        if isinstance(key, (int, slice)):
            return self._values[key]
        try:
            return self._values[self._names.index(key)]
        except ValueError:
            raise IndexError(f"No item with that key: {key}") from None

    def __len__(self):
        return len(self._values)

    def __iter__(self):
        return iter(self._values)

    def __eq__(self, other):
        return isinstance(other, Row) and self._values == other._values and self._names == other._names

    def __repr__(self):
        return f"Row({dict(zip(self._names, self._values))})"


class Cursor:
    def __init__(self, raw):
        self._raw = raw

    def _names(self):
        description = self._raw.description
        return [d[0] for d in description] if description else []

    def _wrap(self, row):
        return None if row is None else Row(self._names(), row)

    def fetchone(self):
        try:
            return self._wrap(self._raw.fetchone())
        except ValueError as error:
            raise _translate(error) from error

    def fetchall(self):
        try:
            names = self._names()
            return [Row(names, row) for row in self._raw.fetchall()]
        except ValueError as error:
            raise _translate(error) from error

    def __iter__(self):
        return iter(self.fetchall())

    @property
    def lastrowid(self):
        return self._raw.lastrowid

    @property
    def rowcount(self):
        return self._raw.rowcount

    @property
    def description(self):
        return self._raw.description


class Connection:
    def __init__(self, factory):
        self._factory = factory
        self._raw = factory()
        self._in_tx = False  # อยู่ในทรานแซกชันที่เราเปิดเอง (BEGIN ... COMMIT) หรือไม่

    def _reconnect(self):
        try:
            self._raw.close()
        except Exception:  # noqa: BLE001
            pass
        self._raw = self._factory()

    def _run(self, call):
        """เรียก libsql พร้อมแปลง error; ถ้า stream ฝั่ง Turso หลุด (เช่น หลัง DDL) และไม่ได้อยู่ในทรานแซกชัน ให้ต่อใหม่แล้วลองซ้ำ 1 ครั้ง"""
        try:
            return call(self._raw)
        except ValueError as error:
            if "stream not found" in str(error) and not self._in_tx:
                self._reconnect()
                try:
                    return call(self._raw)
                except ValueError as again:
                    raise _translate(again) from again
            if "stream not found" in str(error):
                self._in_tx = False
                raise sqlite3.OperationalError("database is locked (connection lost mid-transaction)") from error
            raise _translate(error) from error

    def execute(self, sql, params=()):
        sql, params = _positional(sql, params)
        head = sql.lstrip()[:8].upper()
        try:
            cursor = Cursor(self._run(lambda raw: raw.execute(sql, params)))
        except sqlite3.Error as error:
            # ROLLBACK ตอนไม่มีทรานแซกชัน (Turso ยกเลิกให้เองหลัง stream ว่างนานไป) ไม่ใช่ปัญหา: ข้ามได้
            if head.startswith("ROLLBACK") and "no transaction" in str(error).lower():
                self._in_tx = False
                return None
            raise
        if head.startswith("BEGIN"):
            self._in_tx = True
        elif head.startswith(("COMMIT", "ROLLBACK", "END")):
            self._in_tx = False
        return cursor

    def executescript(self, script):
        return self._run(lambda raw: raw.executescript(script))

    @property
    def in_transaction(self):
        return self._raw.in_transaction

    def commit(self):
        self._in_tx = False
        return self._run(lambda raw: raw.commit())

    def rollback(self):
        self._in_tx = False
        return self._run(lambda raw: raw.rollback())

    def close(self):
        try:
            return self._raw.close()
        except Exception:  # noqa: BLE001 - ปิดไม่ได้ก็ไม่ควรทำให้คำขอล้ม
            return None


def connect(target, url=None, auth_token=None):
    """เปิด connection ผ่าน libsql: ถ้ามี url = Turso ระยะไกล ไม่งั้นใช้ไฟล์ในเครื่อง (ไว้ทดสอบ)"""
    import libsql  # นำเข้าตอนใช้ เพื่อให้โหมด sqlite3 ปกติไม่ต้องติดตั้ง libsql

    def factory():
        if url:
            return libsql.connect(url, auth_token=auth_token or "", isolation_level=None)
        return libsql.connect(target, isolation_level=None)

    return Connection(factory)
