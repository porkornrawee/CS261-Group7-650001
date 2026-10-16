"""สร้างภาพ QR Code (PNG) จากรหัสการจอง

ใช้ตัวเข้ารหัส QR ของ reportlab สร้างเมทริกซ์ แล้ววาดเป็นภาพด้วย Pillow
ภาพที่ได้เป็น QR มาตรฐาน สแกนด้วยกล้องมือถือได้จริง
"""

import base64
import io

from PIL import Image
from reportlab.graphics.barcode import qrencoder


def make_qr_png(text, box_size=10, border=4):
    """คืนค่าไบต์ของภาพ PNG ที่เป็น QR ของข้อความ text

    box_size = ขนาดจุดละกี่พิกเซล, border = ขอบขาวรอบ QR (มาตรฐานคือ 4 จุด)
    ระดับแก้ไขข้อผิดพลาด M (กู้ข้อมูลได้ราว 15%)
    """
    qr = qrencoder.QRCode(None, qrencoder.QRErrorCorrectLevel.M)  # None = เลือกเวอร์ชันเอง
    qr.addData(text)
    qr.make()

    modules = qr.getModuleCount()
    size = (modules + 2 * border) * box_size
    image = Image.new("L", (size, size), 255)
    pixels = image.load()
    for row in range(modules):
        for col in range(modules):
            if qr.isDark(row, col):
                x0 = (col + border) * box_size
                y0 = (row + border) * box_size
                for dy in range(box_size):
                    for dx in range(box_size):
                        pixels[x0 + dx, y0 + dy] = 0

    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def to_data_uri(png_bytes):
    """แปลง PNG เป็น data URI เพื่อแสดงใน <img> ได้ทันทีโดยไม่ต้องยิง request เพิ่ม"""
    return "data:image/png;base64," + base64.b64encode(png_bytes).decode("ascii")
