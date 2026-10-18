/**
 * EmptyState — หน้า/ตารางที่ยังไม่มีข้อมูล
 * Owner: Dev 1 | Ticket: UI-10 | Priority: P2 (ข้ามได้ ไม่ต้องทำรอบ Demo)
 * @param { {icon?:string, title:string, hint?:string} } props
 * @returns {HTMLElement}
 * Done when: ข้อความไทย อ่านง่าย
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .empty-state- ใน EmptyState.css)
 */
import { h } from '../../core/dom.js';
export function EmptyState({ icon = '○', title = '', hint = '' } = {}) {
  return h('div', { class: 'empty-state-root' }, h('span', { 'aria-hidden': 'true' }, icon),
    h('h3', null, title), hint ? h('p', null, hint) : null);
}