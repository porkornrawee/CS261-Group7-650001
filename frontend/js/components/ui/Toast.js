/**
 * Toast — ข้อความลอยชั่วคราวมุมจอ
 * Owner: Dev 1 | Ticket: UI-07 | Priority: P1
 * @param { {message:string, tone?:'success'|'error'|'info', durationMs?:number}  + export function showToast(message, tone) } props
 * @returns {HTMLElement}
 * Done when: หายเองใน 4 วินาที, ซ้อนหลายอันได้
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .toast- ใน Toast.css)
 */
import { todo } from '../../core/dom.js';

export function Toast(props = {}) {
  // TODO(Dev 1): แทนที่ด้วย implementation จริง (ลบ todo() ทิ้ง)
  return todo('Toast', 1, 'UI-07');
}

/** เรียกจาก page ได้ทุกที่: showToast('บันทึกแล้ว', 'success') */
export function showToast(message, tone = 'info') {
  // TODO(Dev 1): สร้าง Toast ต่อท้าย document.body แล้วลบหลัง durationMs
  console.info('[toast TODO]', tone, message);
}
