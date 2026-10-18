/**
 * Chip — ปุ่มตัวเลือกทรงเม็ดยา (ใช้เลือกวัน/เวลา/ระยะเวลา)
 * Owner: Dev 1 | Ticket: UI-04 | Priority: P2 (ข้ามได้ ไม่ต้องทำรอบ Demo)
 * @param { {label:string, selected?:boolean, disabled?:boolean, onClick?:()=>void} } props
 * @returns {HTMLElement}
 * Done when: สถานะ selected/disabled ชัดเจน
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .chip- ใน Chip.css)
 */
import { h } from '../../core/dom.js';
export function Chip({ label = '', selected = false, disabled = false, onClick } = {}) {
  return h('button', {
    type: 'button', class: `chip-root${selected ? ' chip-root--selected' : ''}`, disabled,
    'aria-pressed': String(selected), ...(onClick ? { onClick } : {})
  }, label);
}
