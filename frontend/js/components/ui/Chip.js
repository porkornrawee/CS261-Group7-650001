/**
 * Chip — ปุ่มตัวเลือกทรงเม็ดยา (ใช้เลือกวัน/เวลา/ระยะเวลา)
 * Owner: Dev 1 | Ticket: UI-04 | Priority: P2 (ข้ามได้ ไม่ต้องทำรอบ Demo)
 * @param { {label:string, selected?:boolean, disabled?:boolean, onClick?:()=>void} } props
 * @returns {HTMLElement}
 * Done when: สถานะ selected/disabled ชัดเจน
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .chip- ใน Chip.css)
 */
import { todo } from '../../core/dom.js';

export function Chip(props = {}) {
  // TODO(Dev 1): แทนที่ด้วย implementation จริง (ลบ todo() ทิ้ง)
  return todo('Chip', 1, 'UI-04');
}
