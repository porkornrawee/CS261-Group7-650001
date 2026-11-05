/** Dialog modal สำหรับยืนยันการยกเลิกการจอง (US3) พร้อม warning icon และรายละเอียดยืนยัน */
import { h } from '../../core/dom.js';
import { cancelReservation } from '../../api/reservations.js';
import { messageFor } from '../../api/errors.js';

export function CancelDialog({ code, onSuccess } = {}) {
  const error = h('p', {
    class: 'cancel-dialog__error',
    role: 'alert',
    hidden: true,
  });
  const confirm = h('button', {
    class: 'button-root cancel-dialog__confirm',
    type: 'button',
    onClick: async () => {
      confirm.disabled = true;
      confirm.textContent = 'กำลังยกเลิกการจอง…';
      error.hidden = true;
      try {
        const result = await cancelReservation(code);
        onSuccess?.(result.reservation);
        dialog.close();
      } catch (apiError) {
        error.textContent = messageFor(apiError);
        error.hidden = false;
      } finally {
        confirm.disabled = false;
        confirm.textContent = 'ยืนยันยกเลิกการจอง';
      }
    },
  }, 'ยืนยันยกเลิกการจอง');

  const dialog = h('dialog', {
    class: 'cancel-dialog',
    'aria-labelledby': 'cancel-dialog-title',
    onCancel: () => { error.hidden = true; },
  },
  h('section', { class: 'cancel-dialog__content' },
    h('div', { class: 'cancel-dialog__icon', 'aria-hidden': 'true' }, '⚠️'),
    h('h2', { id: 'cancel-dialog-title', class: 'cancel-dialog__title' }, 'ยืนยันยกเลิกการจอง'),
    h('p', { class: 'cancel-dialog__message' }, 'เมื่อกดยืนยัน ระบบจะคืนช่องจอดให้ผู้อื่นทันที และไม่สามารถเรียกคืนได้'),
    h('div', { class: 'cancel-dialog__info-box' },
      h('span', null, 'รหัสการจอง'),
      h('strong', null, code)
    ),
    error,
    h('div', { class: 'cancel-dialog__actions' },
      confirm,
      h('button', {
        class: 'button-root cancel-dialog__back',
        type: 'button',
        onClick: () => dialog.close(),
      }, 'ไม่ยกเลิก')
    )
  ));
  return dialog;
}
