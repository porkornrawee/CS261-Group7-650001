/**
 * Alert — กล่องข้อความแจ้งผลในหน้า (สำเร็จ/ผิดพลาด/ข้อมูล)
 * Owner: Dev 1 | Ticket: UI-06 | Priority: P0
 * @param { {tone:'success'|'error'|'info', message:string} } props
 * @returns {HTMLElement}
 * Done when: มี role=alert สำหรับ error
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .alert- ใน Alert.css)
 */
import { h } from '../../core/dom.js';
export function Alert({ tone = 'info', message = '' } = {}) {
  return h('div', { class: `alert-root alert-root--${tone}`, role: tone === 'error' ? 'alert' : 'status' }, message);
}
