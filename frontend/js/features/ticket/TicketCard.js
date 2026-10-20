/**
 * TicketCard — บัตรจอง: รหัส PK-XXXXXXXX, QR, ช่อง/โซน/วัน/เวลา, ปุ่มบันทึกรูป
 * Owner: Dev 4 | Ticket: TK-01 | Priority: P0
 * @param { {reservation:{code:string,slot:string,zone:string,date:string,start:string,end:string,user_name:string}, qrSrc:string} } props
 * @returns {HTMLElement}
 * Done when: QR แสดงชัด พิมพ์/บันทึกรูปได้ (ดูโค้ดเดิม showTicket())
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .ticket-card- ใน TicketCard.css)
 */
import { h } from '../../core/dom.js';
import { thaiDate } from '../../core/time.js';

export function TicketCard({ reservation = {}, qrSrc = '' } = {}) {
  const row = (label, value) => h('div', { class: 'ticket-card-row' },
    h('dt', null, label), h('dd', null, value || '–'));
  return h('article', { class: 'ticket-card-root' },
    h('p', { class: 'ticket-card-code' }, reservation.code),
    qrSrc ? h('img', { class: 'ticket-card-qr', src: qrSrc, alt: `QR Code ${reservation.code}` }) : null,
    h('dl', { class: 'ticket-card-details' },
      row('ผู้จอง', reservation.user_name),
      row('ช่องจอด', reservation.slot ? `${reservation.slot} · ${reservation.zone}` : ''),
      row('วันที่', reservation.date ? thaiDate(reservation.date) : ''),
      row('เวลา', reservation.start ? `${reservation.start}–${reservation.end} น.` : '')),
    qrSrc ? h('a', {
      class: 'ticket-card-save', href: qrSrc, download: `${reservation.code}.png`,
    }, 'บันทึกรูป QR') : null);
}
