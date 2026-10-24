/** Dialog modal สำหรับยืนยันการยกเลิกการจอง (US3). */
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
      confirm.textContent = 'กำลังยกเลิก…';
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
        confirm.textContent = 'ยืนยันยกเลิก';
      }
    },
  }, 'ยืนยันยกเลิก');
  const dialog = h('dialog', {
    class: 'cancel-dialog',
    'aria-labelledby': 'cancel-dialog-title',
    onCancel: () => { error.hidden = true; },
  },
  h('section', { class: 'cancel-dialog__content' },
    h('h2', { id: 'cancel-dialog-title', class: 'cancel-dialog__title' }, 'ยืนยันการยกเลิกการจอง'),
    h('p', { class: 'cancel-dialog__message' }, `ต้องการยกเลิกการจอง ${code} ใช่หรือไม่?`),
    error,
    h('div', { class: 'cancel-dialog__actions' },
      h('button', {
        class: 'button-root button-root--secondary',
        type: 'button',
        onClick: () => dialog.close(),
      }, 'กลับ'),
      confirm
    )
  ));
  return dialog;
}
