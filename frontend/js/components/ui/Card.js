/**
 * Card — กรอบการ์ดพื้นขาว เงานุ่ม ใช้ห่อเนื้อหาทุกหน้า
 * Owner: Dev 1 | Ticket: UI-02 | Priority: P0
 * @param { {title?:string, children?:Node|Node[]} } props
 * @returns {HTMLElement}
 * Done when: ใช้ห่อ component อื่นได้, ไม่ hard-code สี
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .card- ใน Card.css)
 */
import { h } from '../../core/dom.js';
export function Card({ title, children = [] } = {}) {
  return h('article', { class: 'card-root' }, title ? h('h2', { class: 'card-title' }, title) : null, children);
}

