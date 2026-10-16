/**
 * TicketCard — บัตรจอง: รหัส PK-XXXXXXXX, QR, ช่อง/โซน/วัน/เวลา, ปุ่มบันทึกรูป
 * Owner: Dev 4 | Ticket: TK-01 | Priority: P0
 * @param { {reservation:{code:string,slot:string,zone:string,date:string,start:string,end:string,user_name:string}, qrSrc:string} } props
 * @returns {HTMLElement}
 * Done when: QR แสดงชัด พิมพ์/บันทึกรูปได้ (ดูโค้ดเดิม showTicket())
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .ticket-card- ใน TicketCard.css)
 */
import { todo } from '../../core/dom.js';

export function TicketCard(props = {}) {
  // TODO(Dev 4): แทนที่ด้วย implementation จริง (ลบ todo() ทิ้ง)
  return todo('TicketCard', 4, 'TK-01');
}
