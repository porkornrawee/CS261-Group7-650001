/**
 * StudentVerifyStatus — แสดงสถานะการตรวจกับ TU: idle → กำลังตรวจ → ผ่าน (ชื่อ/คณะ) → Invalid user
 * Owner: Dev 2 | Ticket: VH-02 | Priority: P0
 * @param { {state:'idle'|'checking'|'ok'|'invalid'|'unavailable', student?:{name:string,faculty:string}, message?:string} } props
 * @returns {HTMLElement}
 * Done when: ครบ 5 สถานะ ตามแผนภาพ sequence
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .student-verify-status- ใน StudentVerifyStatus.css)
 */
import { todo } from '../../core/dom.js';

export function StudentVerifyStatus(props = {}) {
  // TODO(Dev 2): แทนที่ด้วย implementation จริง (ลบ todo() ทิ้ง)
  return todo('StudentVerifyStatus', 2, 'VH-02');
}
