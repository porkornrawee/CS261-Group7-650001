/**
 * ReservationLookup — ช่องค้นการจองจากรหัส (ด่านทางเข้า) + แสดงผลพบ/ไม่พบ
 * Owner: Dev 4 | Ticket: TK-02 | Priority: P1
 * @param { {busy?:boolean, result?:object|null, notFound?:boolean, onSearch:(code:string)=>void} } props
 * @returns {HTMLElement}
 * Done when: รับรหัสพิมพ์เล็กได้ (backend แปลงเป็นตัวใหญ่), ไม่พบแสดงข้อความไทย
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .reservation-lookup- ใน ReservationLookup.css)
 */
import { todo } from '../../core/dom.js';

export function ReservationLookup(props = {}) {
  // TODO(Dev 4): แทนที่ด้วย implementation จริง (ลบ todo() ทิ้ง)
  return todo('ReservationLookup', 4, 'TK-02');
}
