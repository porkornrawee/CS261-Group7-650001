/**
 * DateStrip — แถบเลือกวัน 14 วัน (วันนี้ + 13 วันถัดไป ตามโค้ดเก่า)
 * Owner: Dev 2 | Ticket: BK-01 | Priority: P0
 * @param { {value:string, days?:number, onChange:(date:string)=>void} } props
 * @returns {HTMLElement}
 * Done when: ใช้ ymd()/thaiDate() จาก core/time.js, เลื่อนแนวนอนได้บนมือถือ
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .date-strip- ใน DateStrip.css)
 */
import { todo } from '../../core/dom.js';

export function DateStrip(props = {}) {
  // TODO(Dev 2): แทนที่ด้วย implementation จริง (ลบ todo() ทิ้ง)
  return todo('DateStrip', 2, 'BK-01');
}
