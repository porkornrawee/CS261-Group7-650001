/**
 * Spinner — ไอคอนหมุนระหว่างโหลด
 * Owner: Dev 1 | Ticket: UI-09 | Priority: P2 (ข้ามได้ ไม่ต้องทำรอบ Demo)
 * @param { {label?:string} } props
 * @returns {HTMLElement}
 * Done when: มี aria-live ข้อความ 'กำลังโหลด'
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .spinner- ใน Spinner.css)
 */
import { todo } from '../../core/dom.js';

export function Spinner(props = {}) {
  // TODO(Dev 1): แทนที่ด้วย implementation จริง (ลบ todo() ทิ้ง)
  return todo('Spinner', 1, 'UI-09');
}
