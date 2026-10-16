/**
 * Button — ปุ่มมาตรฐาน (primary=ส้ม, secondary, ghost)
 * Owner: Dev 1 | Ticket: UI-01 | Priority: P0
 * @param { {label:string, variant?:'primary'|'secondary'|'ghost', disabled?:boolean, loading?:boolean, type?:'button'|'submit', onClick?:(e:Event)=>void} } props
 * @returns {HTMLElement}
 * Done when: 3 variant ตาม tokens, มี state loading/disabled, โฟกัสด้วยคีย์บอร์ดเห็นชัด
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .button- ใน Button.css)
 */
import { todo } from '../../core/dom.js';

export function Button(props = {}) {
  // TODO(Dev 1): แทนที่ด้วย implementation จริง (ลบ todo() ทิ้ง)
  return todo('Button', 1, 'UI-01');
}
