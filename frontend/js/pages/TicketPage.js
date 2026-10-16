/**
 * TicketPage — หน้าบัตรจอง (โหลดจากรหัสใน URL) + ReservationLookup
 * Owner: Dev 4 | Ticket: PG-04 | Priority: P0 | Route: #/ticket/:code
 * @param { { params: Record<string,string> } } ctx  พารามิเตอร์จาก URL (เช่น ticket → params.code)
 * @returns {HTMLElement}
 * Page เท่านั้นที่คุยกับ js/api/* และ js/store.js ได้ (component ใน ui/ ห้ามรู้จัก api)
 */
import { todo } from '../core/dom.js';

export function TicketPage(ctx = { params: {} }) {
  // TODO(Dev 4): ประกอบ component + เรียก api แล้วคืน element ของหน้า
  return todo('TicketPage', 4, 'PG-04', ctx.params);
}
