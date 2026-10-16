/**
 * HomePage — หน้าแรก: การ์ดเมนู 3 ใบ (ลงทะเบียนรถ / จองที่จอด / ตรวจบัตรและประวัติ)
 * Owner: Dev 1 | Ticket: PG-01 | Priority: P0 | Route: #/
 * @param { { params: Record<string,string> } } ctx  พารามิเตอร์จาก URL (เช่น ticket → params.code)
 * @returns {HTMLElement}
 * Page เท่านั้นที่คุยกับ js/api/* และ js/store.js ได้ (component ใน ui/ ห้ามรู้จัก api)
 */
import { todo } from '../core/dom.js';

export function HomePage(ctx = { params: {} }) {
  // TODO(Dev 1): ประกอบ component + เรียก api แล้วคืน element ของหน้า
  return todo('HomePage', 1, 'PG-01', ctx.params);
}
