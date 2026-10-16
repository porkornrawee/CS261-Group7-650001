/**
 * Field — ช่องกรอกข้อมูล + label + ข้อความ error ใต้ช่อง
 * Owner: Dev 1 | Ticket: UI-03 | Priority: P0
 * @param { {id:string, label:string, type?:string, value?:string, placeholder?:string, error?:string, maxLength?:number, onInput?:(value:string)=>void} } props
 * @returns {HTMLElement}
 * Done when: แสดง error เป็นสีแดงใต้ช่อง, label ผูกกับ input (a11y)
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .field- ใน Field.css)
 */
import { todo } from '../../core/dom.js';

export function Field(props = {}) {
  // TODO(Dev 1): แทนที่ด้วย implementation จริง (ลบ todo() ทิ้ง)
  return todo('Field', 1, 'UI-03');
}
