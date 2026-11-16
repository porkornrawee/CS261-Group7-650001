/**
 * core/plate.js — ตรวจรูปแบบทะเบียนรถไทยฝั่งหน้าเว็บ (Owner: Dev 3 | QA US7)
 * แยกออกมาจาก BookingPage เพื่อให้เทสต์ได้ (frontend/tests/booking-ui.test.mjs)
 * ต้องตรงกับ PLATE_RE ใน backend-python/booking_service.py — backend ตรวจซ้ำเสมอ
 *
 * รูปแบบ: [เลข 1 หลัก] + พยัญชนะ 1-3 ตัว + [เว้นวรรค] + ตัวเลข 1-4 หลัก เช่น กข 1234, 1กข 1234
 */
export const PLATE_RE = /^[0-9]?[ก-ฮ]{1,3} ?[0-9]{1,4}$/;

export const PLATE_EMPTY_MESSAGE = 'กรุณากรอกทะเบียนรถ';
export const PLATE_FORMAT_MESSAGE = 'รูปแบบทะเบียนรถไม่ถูกต้อง (ตัวอย่าง: กข 1234 หรือ 1กข 1234)';

/** ตัดช่องว่างหัวท้าย และรวมช่องว่างซ้ำให้เหลือ 1 ช่อง */
export function normalizePlate(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

/** คืนข้อความ error ภาษาไทย หรือ '' ถ้าทะเบียนถูกต้อง */
export function plateErrorFor(value) {
  const plate = normalizePlate(value);
  if (!plate) return PLATE_EMPTY_MESSAGE;
  if (!PLATE_RE.test(plate)) return PLATE_FORMAT_MESSAGE;
  return '';
}
