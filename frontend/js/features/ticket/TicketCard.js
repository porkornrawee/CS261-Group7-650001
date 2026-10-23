/**
 * TicketCard — บัตรจองพร้อม QR และรายละเอียดการจอด
 * Owner: Dev 4 | Ticket: TK-01 | Priority: P0
 * @param {{reservation:{code:string,slot:string,zone:string,date:string,start:string,end:string,user_name:string}, qrSrc?:string}} props
 * @returns {HTMLElement}
 */
import { h } from '../../core/dom.js';
import { thaiDate } from '../../core/time.js';

export function TicketCard({ reservation = {}, qrSrc = '' } = {}) {
  const {
    code = 'PK-????????',
    slot = '-',
    zone = '-',
    date = '-',
    start = '-',
    end = '-',
    user_name = '-',
  } = reservation;
  const displayDate = date === '-' ? '-' : thaiDate(date);
  const qrFrame = h('div', { class: 'ticket-card__qr-frame' });
  let downloadLink = null;

  if (qrSrc) {
    qrFrame.append(h('img', {
      class: 'ticket-card__qr',
      src: qrSrc,
      alt: 'QR Code รหัสการจอง ' + code,
      onError: () => {
        qrFrame.replaceChildren(h('p', {
          class: 'ticket-card__qr-error',
          role: 'alert',
        }, 'โหลดภาพ QR ไม่สำเร็จ กรุณาลองใหม่'));
        downloadLink?.remove();
      },
    }));
    downloadLink = h('a', {
      class: 'button-root button-root--secondary ticket-card__download',
      href: qrSrc,
      download: code + '.png',
      'aria-label': 'บันทึก QR Code ' + code,
    }, 'บันทึก QR Code');
  } else {
    qrFrame.append(h('p', {
      class: 'ticket-card__qr-placeholder',
      role: 'status',
    }, 'ไม่มีภาพ QR สำหรับรายการนี้'));
  }

  return h('article', { class: 'ticket-card' },
    h('header', { class: 'ticket-card__header' },
      h('h2', { class: 'ticket-card__title' }, 'บัตรจองที่จอดรถ'),
      h('p', { class: 'ticket-card__code' }, code)
    ),
    h('div', { class: 'ticket-card__body' },
      qrFrame,
      h('p', { class: 'ticket-card__note' }, 'แสดง QR นี้ที่ทางเข้า'),
      h('dl', { class: 'ticket-card__meta' },
        h('dt', {}, 'ผู้จอง'), h('dd', {}, user_name),
        h('dt', {}, 'โซน'), h('dd', {}, zone),
        h('dt', {}, 'ช่องจอด'), h('dd', {}, slot),
        h('dt', {}, 'วันที่'), h('dd', {}, displayDate),
        h('dt', {}, 'เวลา'), h('dd', {}, start + '–' + end + ' น.')
      )
    ),
    h('div', { class: 'ticket-card__actions' },
      downloadLink,
      h('button', {
        class: 'button-root button-root--primary ticket-card__print',
        type: 'button',
        onClick: () => window.print(),
      }, 'พิมพ์บัตร')
    )
  );
}
