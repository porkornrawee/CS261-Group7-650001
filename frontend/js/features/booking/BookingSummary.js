/**
 * BookingSummary — สรุปก่อนยืนยัน (วัน เวลา ช่อง ทะเบียนรถ) + ปุ่มยืนยัน
 * Owner: Dev 3 | Ticket: BK-07 | Priority: P0
 * @param { {summary:{date:string,start:string,end:string,slotLabel?:string,zoneName?:string,plate?:string}, busy?:boolean, onConfirm:()=>void} } props
 * @returns {HTMLElement}
 * Done when: ปุ่มยืนยันปิดจนกว่าจะเลือกช่องครบ
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .booking-summary- ใน BookingSummary.css)
 */
import { todo } from '../../core/dom.js';

export function BookingSummary(props = {}) {
  // TODO(Dev 3): แทนที่ด้วย implementation จริง (ลบ todo() ทิ้ง)
  return todo('BookingSummary', 3, 'BK-07');
}
