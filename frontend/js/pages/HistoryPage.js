/**
 * HistoryPage — หน้ารายการจองล่าสุด (ReservationTable)
 * Owner: Dev 4 | Ticket: PG-05 | Priority: P0 | Route: #/history
 * @param { { params: Record<string,string> } } ctx  พารามิเตอร์จาก URL (เช่น ticket → params.code)
 * @returns {HTMLElement}
 * Page เท่านั้นที่คุยกับ js/api/* และ js/store.js ได้ (component ใน ui/ ห้ามรู้จัก api)
 */
import { todo } from '../core/dom.js';

export function HistoryPage(ctx = { params: {} }) {
  // TODO(Dev 4): ประกอบ component + เรียก api แล้วคืน element ของหน้า
  return todo('HistoryPage', 4, 'PG-05', ctx.params);
}
