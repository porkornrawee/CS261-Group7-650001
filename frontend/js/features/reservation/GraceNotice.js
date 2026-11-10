/**
 * GraceNotice — ข้อความ "ต้องสแกน QR ภายใน X นาทีหลังเวลาเริ่ม" (Owner: Dev 1 | Ticket: US12)
 * ใช้ใน BookingSummary (ก่อนยืนยันจอง) และ TicketCard (บัตรจองที่ยัง active)
 * @param {{ graceMin?:number, start?:string }} props  start = 'HH:MM' (ถ้ามีจะบอกเวลาสุดท้ายที่สแกนได้)
 *
 * STATUS_TEXT ใช้ร่วมกับ Dev 4 (US3/US5) — สถานะชุดเดียวกับ backend:
 *   active | checked_in | completed | cancelled | auto_cancelled
 */
import { h } from '../../core/dom.js';
import { toMin, fromMin } from '../../core/time.js';

export const DEFAULT_GRACE_MIN = 15;

export const STATUS_TEXT = {
  cancelled: 'ยกเลิกแล้ว',
  auto_cancelled: 'ยกเลิกอัตโนมัติแล้ว เนื่องจากไม่สแกน QR ภายในเวลาที่กำหนด',
  checked_in: 'เช็กอินแล้ว',
  completed: 'ใช้งานเสร็จแล้ว',
};

export function graceText(graceMin = DEFAULT_GRACE_MIN, start = '') {
  const minutes = Number.isFinite(Number(graceMin)) && Number(graceMin) > 0 ? Number(graceMin) : DEFAULT_GRACE_MIN;
  const deadline = /^\d{2}:\d{2}$/.test(start) ? ` (ภายใน ${fromMin(toMin(start) + minutes)} น.)` : '';
  return `ต้องสแกน QR ภายใน ${minutes} นาทีหลังเวลาเริ่ม${deadline} ไม่เช่นนั้นระบบจะยกเลิกการจองอัตโนมัติ`;
}

export function GraceNotice({ graceMin = DEFAULT_GRACE_MIN, start = '' } = {}) {
  return h('p', { class: 'grace-notice', role: 'note' },
    h('span', { class: 'grace-notice__icon', 'aria-hidden': 'true' }, '⏱'),
    h('span', null, graceText(graceMin, start)),
  );
}