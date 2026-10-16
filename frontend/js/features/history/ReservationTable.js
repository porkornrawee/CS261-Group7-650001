/**
 * ReservationTable — ตารางรายการจองล่าสุด
 * Owner: Dev 4 | Ticket: HS-01 | Priority: P0
 * @param { {reservations:Array<{code:string,slot:string,zone:string,date:string,start:string,end:string}>, onOpen?:(code:string)=>void} } props
 * @returns {HTMLElement}
 * Done when: บนมือถือแปลงเป็นการ์ดเรียงลง ไม่ scroll แนวนอน; ว่าง = EmptyState
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .reservation-table- ใน ReservationTable.css)
 */
import { todo } from '../../core/dom.js';

export function ReservationTable(props = {}) {
  // TODO(Dev 4): แทนที่ด้วย implementation จริง (ลบ todo() ทิ้ง)
  return todo('ReservationTable', 4, 'HS-01');
}
