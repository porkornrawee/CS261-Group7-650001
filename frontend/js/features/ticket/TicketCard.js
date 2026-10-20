/**
 * TicketCard — บัตรจอง: รหัส PK-XXXXXXXX, QR, ช่อง/โซน/วัน/เวลา, ปุ่มบันทึกรูป
 * Owner: Dev 4 | Ticket: TK-01 | Priority: P0
 * @param { {reservation:{code:string,slot:string,zone:string,date:string,start:string,end:string,user_name:string}, qrSrc:string} } props
 * @returns {HTMLElement}
 * Done when: QR แสดงชัด พิมพ์/บันทึกรูปได้ (ดูโค้ดเดิม showTicket())
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .ticket-card- ใน TicketCard.css)
 */
import { todo } from '../../core/dom.js';

import { h } from '../../core/dom.js';

export function TicketCard(props = {}) {
  const { reservation = {}, qrSrc = '' } = props;
  const { code = '-', slot = '-', zone = '-', date = '-', start = '-', end = '-', user_name = '-' } = reservation;

  return h('div', { class: 'ticket-card' },
    h('div', { class: 'ticket-card__header' },
      h('h3', { class: 'ticket-card__title' }, 'บัตรจอดรถ'),
      h('span', { class: 'ticket-card__code' }, code)
    ),
    h('div', { class: 'ticket-card__body' },
      qrSrc 
        ? h('img', { class: 'ticket-card__qr', src: qrSrc, alt: `QR Code ${code}` }) 
        : h('div', { class: 'ticket-card__qr-placeholder' }, '[ QR Code ]'),
      h('div', { class: 'ticket-card__info' },
        h('div', { class: 'ticket-card__row' }, h('span', {}, 'ผู้จอง:'), h('strong', {}, user_name)),
        h('div', { class: 'ticket-card__row' }, h('span', {}, 'โซน / ช่อง:'), h('strong', {}, `${zone} / ${slot}`)),
        h('div', { class: 'ticket-card__row' }, h('span', {}, 'วันที่:'), h('strong', {}, date)),
        h('div', { class: 'ticket-card__row' }, h('span', {}, 'เวลา:'), h('strong', {}, `${start} - ${end} น.`))
      )
    ),
    h('div', { class: 'ticket-card__footer' },
      h('button', {
        class: 'btn btn--primary ticket-card__btn',
        type: 'button',
        onClick: () => window.print()
      }, 'บันทึก / พิมพ์รูป')
    )
  );
}
