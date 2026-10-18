/**
 * Button — ปุ่มมาตรฐาน (primary=ส้ม, secondary, ghost)
 * Owner: Dev 1 | Ticket: UI-01 | Priority: P0
 * @param { {label:string, variant?:'primary'|'secondary'|'ghost', disabled?:boolean, loading?:boolean, type?:'button'|'submit', onClick?:(e:Event)=>void} } props
 * @returns {HTMLElement}
 * Done when: 3 variant ตาม tokens, มี state loading/disabled, โฟกัสด้วยคีย์บอร์ดเห็นชัด
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .button- ใน Button.css)
 */
import { h } from '../../core/dom.js';
export function Button({ label = '', variant = 'primary', disabled = false, loading = false, type = 'button', onClick } = {}) {
  return h('button', {
    type, class: `button-root button-root--${variant}`, disabled: disabled || loading,
    ...(onClick ? { onClick } : {}),
  }, loading ? 'กำลังดำเนินการ…' : label);
}

