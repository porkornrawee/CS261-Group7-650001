"""ตัวเรียก TU REST API เพื่อตรวจรหัสนักศึกษา (เรียกจาก backend เท่านั้น)

ตั้งค่าผ่าน env: TU_API_KEY (Application-Key), TU_API_URL (ไม่ตั้ง = ค่าใน config.py)
ไม่มี TU_API_KEY -> create_tu_client() คืน None แล้ว vehicle_service ใช้ข้อมูลจำลองแทน
"""

import json
import os
import urllib.error
import urllib.parse
import urllib.request

from booking_service import BookingError
from config import TU_API_TIMEOUT, TU_API_URL, TU_AUTH_URL


class TuApiClient:
    def __init__(self, api_key, base_url=TU_API_URL, timeout=TU_API_TIMEOUT, auth_url=TU_AUTH_URL):
        self.api_key = api_key
        self.base_url = base_url
        self.timeout = timeout
        self.auth_url = auth_url

    def verify_login(self, username, password):
        """ตรวจรหัสผ่านกับ มธ. (บัญชีเดียวกับ reg) — ถูก: คืน {"student_id","name"}; ผิด: คืน None;
        เรียกไม่ได้/Application-Key ใช้ไม่ได้ = TU_UNAVAILABLE"""
        req = urllib.request.Request(
            self.auth_url,
            data=json.dumps({"UserName": username, "PassWord": password}).encode(),
            method="POST",
            headers={"Application-Key": self.api_key, "Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as res:
                body = json.load(res)
        except urllib.error.HTTPError as error:
            if error.code == 400:
                return None
            raise _unavailable() from error
        except (urllib.error.URLError, TimeoutError, ValueError) as error:
            raise _unavailable() from error

        if not isinstance(body, dict) or body.get("status") is not True:
            return None
        return {
            "student_id": str(body.get("username") or username),
            "name": body.get("displayname_th") or body.get("displayname_en") or "",
        }

    def get_student(self, student_id):
        """คืน {"name","faculty","email"} ของนักศึกษา; ไม่พบ = TU_NOT_FOUND, เรียกไม่ได้ = TU_UNAVAILABLE"""
        url = f"{self.base_url}?{urllib.parse.urlencode({'id': student_id})}"
        req = urllib.request.Request(
            url, method="POST", headers={"Application-Key": self.api_key}
        )
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as res:
                body = json.load(res)
        except urllib.error.HTTPError as error:
            if error.code in (400, 404):
                raise _not_found() from error
            raise _unavailable() from error
        except (urllib.error.URLError, TimeoutError, ValueError) as error:
            raise _unavailable() from error

        data = body.get("data") if isinstance(body, dict) else None
        if not body.get("status") or not isinstance(data, dict):
            raise _not_found()
        return {
            "name": data.get("displayname_th") or data.get("displayname_en") or "",
            "faculty": data.get("faculty") or "",
            "email": (data.get("email") or "").strip().lower(),
        }


def _not_found():
    return BookingError("TU_NOT_FOUND", "ไม่พบข้อมูลนักศึกษาในระบบ มธ. (Invalid user)", 404)


def _unavailable():
    return BookingError("TU_UNAVAILABLE", "ระบบตรวจสอบของ มธ. ไม่พร้อมใช้งานชั่วคราว", 502)


def create_tu_client():
    """สร้าง client จาก env; คืน None ถ้ายังไม่ตั้ง TU_API_KEY"""
    api_key = os.environ.get("TU_API_KEY")
    if not api_key:
        return None
    return TuApiClient(api_key, os.environ.get("TU_API_URL") or TU_API_URL)
