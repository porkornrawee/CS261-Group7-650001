/**
 * VehiclePage — หน้าลงทะเบียนรถ ตาม sequence: กรอก → verify กับ TU → บันทึก → แสดงผล / Invalid user  (ใช้ VehicleForm, StudentVerifyStatus, VehicleCard, api/vehicles.js)
 * Owner: Dev 2 | Ticket: PG-02 | Priority: P0 | Route: #/vehicle
 * @param { { params: Record<string,string> } } ctx  พารามิเตอร์จาก URL (เช่น ticket → params.code)
 * @returns {HTMLElement}
 * Page เท่านั้นที่คุยกับ js/api/* และ js/store.js ได้ (component ใน ui/ ห้ามรู้จัก api)
 */
import { todo } from '../core/dom.js';

export function VehiclePage(ctx = { params: {} }) {
  // TODO(Dev 2): ประกอบ component + เรียก api แล้วคืน element ของหน้า
  return todo('VehiclePage', 2, 'PG-02', ctx.params);
}
