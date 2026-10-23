/**
 * api/errors.js — แปลง error code เป็นข้อความไทย "ที่เดียว" (Owner: Dev 4 | Ticket: ER-01)
 * page ทุกหน้าเรียก messageFor(error) แทนการเขียนข้อความเอง
 * ข้อความจาก backend (error.message) มีอยู่แล้ว ใช้เป็นค่าสำรองได้
 */
export const ERROR_MESSAGES = {
  VALIDATION_ERROR: 'ข้อมูลที่กรอกไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง',
  SLOT_NOT_FOUND: 'ไม่พบช่องจอดที่เลือก',
  OUTSIDE_HOURS: 'อยู่นอกเวลาเปิดทำการ',
  PAST_TIME: 'ไม่สามารถจองย้อนหลังได้',
  ZONE_FULL: 'โซนนี้เต็มในช่วงเวลาที่เลือก',
  SLOT_CONFLICT: 'ช่องนี้ถูกจองแล้วในช่วงเวลาที่ซ้อนกัน',
  BUSY: 'ระบบกำลังประมวลผลหลายรายการ กรุณาลองใหม่',
  TU_NOT_FOUND: 'ไม่พบข้อมูลนักศึกษาในระบบ มธ. (Invalid user)',
  TU_UNAVAILABLE: 'ระบบตรวจสอบของ มธ. ไม่พร้อมใช้งานชั่วคราว',
  NETWORK_ERROR: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้',
  UNAUTHORIZED: 'กรุณาเข้าสู่ระบบก่อนใช้งาน',
  FORBIDDEN: 'คุณไม่มีสิทธิ์ดำเนินการนี้',
  INVALID_CREDENTIALS: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
  CANCEL_DEADLINE_PASSED: 'เลยกำหนดเวลายกเลิกการจองแล้ว',
  NOT_CANCELLABLE: 'ไม่สามารถยกเลิกการจองนี้ได้',
  EXTEND_CONFLICT: 'ไม่สามารถขยายเวลาจองได้ เนื่องจากช่วงเวลานี้มีการจองแล้ว',
};

/** @param {{code?:string, message?:string, name?:string}} error */
export function messageFor(error) {
  const message = error?.message || '';
  const isNetworkError = !error
    || error.code === 'NETWORK_ERROR'
    || error.name === 'TypeError'
    || /failed to fetch|networkerror|load failed/i.test(message);

  if (isNetworkError) return ERROR_MESSAGES.NETWORK_ERROR;
  return ERROR_MESSAGES[error?.code] || error?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่';
}
