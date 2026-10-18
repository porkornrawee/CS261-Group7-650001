/**
 * Spinner — ไอคอนหมุนระหว่างโหลด
 * Owner: Dev 1 | Ticket: UI-09 | Priority: P2 (ข้ามได้ ไม่ต้องทำรอบ Demo)
 * @param { {label?:string} } props
 * @returns {HTMLElement}
 * Done when: มี aria-live ข้อความ 'กำลังโหลด'
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .spinner- ใน Spinner.css)
 */
import { h } from '../../core/dom.js';
export function Spinner({ label = 'กำลังโหลด' } = {}) {
  return h('span', { class: 'spinner-root', role: 'status', 'aria-live': 'polite' },
    h('span', { class: 'spinner-circle', 'aria-hidden': 'true' }), label);
}

