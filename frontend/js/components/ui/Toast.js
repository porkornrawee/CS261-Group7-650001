/**
 * Toast — ข้อความลอยชั่วคราวมุมจอ
 * Owner: Dev 1 | Ticket: UI-07 | Priority: P1
 * @param { {message:string, tone?:'success'|'error'|'info', durationMs?:number}  + export function showToast(message, tone) } props
 * @returns {HTMLElement}
 * Done when: หายเองใน 4 วินาที, ซ้อนหลายอันได้
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .toast- ใน Toast.css)
 */
import { h } from '../../core/dom.js';
export function Toast({ message = '', tone = 'info' } = {}) {
  return h('div', { class: `toast-root toast-root--${tone}`, role: 'status' }, message);
}
export function showToast(message, tone = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = h('div', { class: 'toast-container', 'aria-live': 'polite' });
    document.body.append(container);
  }
  const toast = Toast({ message, tone });
  container.append(toast);
  window.setTimeout(() => { toast.remove(); if (!container.childElementCount) container.remove(); }, 4000);
  return toast;
}
