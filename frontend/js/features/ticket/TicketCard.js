/**
 * TicketCard — บัตรจองพร้อม QR และรายละเอียดการจอด
 * Owner: Dev 4 | Ticket: TK-01 | Priority: P0
 * @param {{reservation:{code:string,slot:string,zone:string,date:string,start:string,end:string,user_name:string}, qrSrc?:string}} props
 * @returns {HTMLElement}
 */
import { h } from '../../core/dom.js';
import { thaiDate } from '../../core/time.js';
import { CancelDialog } from './CancelDialog.js';

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
  const status = reservation.status || 'active';
  const startAt = date !== '-' && start !== '-'
    ? new Date(`${date}T${start}:00`)
    : null;
  const deadlinePassed = !startAt || Number.isNaN(startAt.getTime())
    || Date.now() > startAt.getTime() - 30 * 60 * 1000;
  const canCancel = status === 'active' && !deadlinePassed;
  const cancellationMessage = status !== 'active'
    ? 'การจองนี้ไม่อยู่ในสถานะที่ยกเลิกได้'
    : 'ยกเลิกไม่ได้ เนื่องจากเหลือน้อยกว่า 30 นาทีก่อนเวลาเริ่มจอง';
  const statusMessage = h('p', {
    class: 'ticket-card__status',
    role: 'status',
    hidden: status !== 'cancelled',
  }, 'ยกเลิกแล้ว');
  const cancelButton = h('button', {
    class: 'button-root ticket-card__cancel',
    type: 'button',
    disabled: !canCancel,
    hidden: status !== 'active',
    onClick: () => cancelDialog.showModal(),
  }, 'ยกเลิกการจอง');
  const cancelNote = h('p', {
    class: 'ticket-card__cancel-note',
    hidden: canCancel || status === 'cancelled',
  }, cancellationMessage);
  const cancelDialog = CancelDialog({
    code,
    onSuccess: () => {
      statusMessage.hidden = false;
      cancelButton.disabled = true;
      cancelButton.hidden = true;
      cancelNote.hidden = true;

    },
  });

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
      }, 'พิมพ์บัตร'),
      cancelButton
    ),
    cancelNote,
    statusMessage,
    cancelDialog
  );
}
