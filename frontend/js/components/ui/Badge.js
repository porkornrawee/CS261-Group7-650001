/**
 * Badge — ป้ายสถานะเล็ก (ว่าง/ติดบางช่วง/เต็ม/ผ่าน/ไม่ผ่าน)
 * Owner: Dev 1 | Ticket: UI-05 | Priority: P1
 * @param { {text:string, tone:'success'|'warning'|'danger'|'neutral'} } props
 * @returns {HTMLElement}
 * Done when: สีมาจาก tokens
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .badge- ใน Badge.css)
 */
import { todo } from '../../core/dom.js';

export function Badge(props = {}) {
  // TODO(Dev 1): แทนที่ด้วย implementation จริง (ลบ todo() ทิ้ง)
  return todo('Badge', 1, 'UI-05');
}
