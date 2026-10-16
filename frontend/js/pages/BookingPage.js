/**
 * BookingPage — หน้าจอง 3 ขั้น: เลือกวัน-เวลา → เลือกช่อง → ยืนยัน แล้วไป #/ticket/<code>  (ใช้ DateStrip, TimeChips, DurationPicker, ParkingLot, BookingSummary, api/zones.js, api/reservations.js)
 * Owner: Dev 3 | Ticket: PG-03 | Priority: P0 | Route: #/booking
 * @param { { params: Record<string,string> } } ctx  พารามิเตอร์จาก URL (เช่น ticket → params.code)
 * @returns {HTMLElement}
 * Page เท่านั้นที่คุยกับ js/api/* และ js/store.js ได้ (component ใน ui/ ห้ามรู้จัก api)
 */
import { todo } from '../core/dom.js';

export function BookingPage(ctx = { params: {} }) {
  // TODO(Dev 3): ประกอบ component + เรียก api แล้วคืน element ของหน้า
  return todo('BookingPage', 3, 'PG-03', ctx.params);
}
