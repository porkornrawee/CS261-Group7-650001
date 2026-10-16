/**
 * EmptyState — หน้า/ตารางที่ยังไม่มีข้อมูล
 * Owner: Dev 1 | Ticket: UI-10 | Priority: P2 (ข้ามได้ ไม่ต้องทำรอบ Demo)
 * @param { {icon?:string, title:string, hint?:string} } props
 * @returns {HTMLElement}
 * Done when: ข้อความไทย อ่านง่าย
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .empty-state- ใน EmptyState.css)
 */
import { todo } from '../../core/dom.js';

export function EmptyState(props = {}) {
  // TODO(Dev 1): แทนที่ด้วย implementation จริง (ลบ todo() ทิ้ง)
  return todo('EmptyState', 1, 'UI-10');
}
