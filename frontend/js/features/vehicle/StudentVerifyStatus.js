/**
 * StudentVerifyStatus — แสดงสถานะการตรวจกับ TU: idle → กำลังตรวจ → ผ่าน (ชื่อ/คณะ) → Invalid user
 * Owner: Dev 2 | Ticket: VH-02 | Priority: P0
 * @param { {state:'idle'|'checking'|'ok'|'invalid'|'unavailable', student?:{name:string,faculty:string}, message?:string} } props
 * @returns {HTMLElement}
 * Done when: ครบ 5 สถานะ ตามแผนภาพ sequence
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .student-verify-status- ใน StudentVerifyStatus.css)
 */
import { h } from '../../core/dom.js';
export function StudentVerifyStatus({ state = 'idle', student = {}, message = '' } = {}) {
  const titles = {
    idle: 'พร้อมตรวจสอบข้อมูล', checking: 'กำลังตรวจสอบข้อมูลนักศึกษา…',
    ok: 'ยืนยันตัวตนสำเร็จ', invalid: 'Invalid user', unavailable: 'ไม่สามารถตรวจสอบข้อมูลได้',
  };
  const details = {
    idle: '', checking: 'กรุณารอสักครู่',
    ok: `${student.name || ''}${student.faculty ? ' · ' + student.faculty : ''}`,
    invalid: 'ไม่พบข้อมูลนักศึกษาในระบบ มธ.', unavailable: 'กรุณาลองใหม่อีกครั้ง',
  };
  return h('div', { class: `student-verify-status-root student-verify-status--${state}`, role: 'status', 'aria-live': 'polite' },
    h('strong', null, titles[state] || titles.idle), h('p', null, message || details[state]));
}
