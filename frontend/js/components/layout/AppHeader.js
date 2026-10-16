/**
 * AppHeader — หัวเว็บสีแดง มธ. + โลโก้ + เมนูนำทาง (Home, ลงทะเบียนรถ, จองที่จอด, ประวัติ)
 * Owner: Dev 1 | Ticket: LY-01 | Priority: P0
 * @param { {activeRoute:string, student?:{name:string}|null} } props
 * @returns {HTMLElement}
 * Done when: โลโก้มุมซ้ายใช้ไฟล์ทางการ, เมนูไฮไลต์หน้าปัจจุบัน, พับเป็นแฮมเบอร์เกอร์บนมือถือ, แล้วลบ #dev-nav ใน index.html
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .app-header- ใน AppHeader.css)
 */
import { todo } from '../../core/dom.js';

export function AppHeader(props = {}) {
  // TODO(Dev 1): แทนที่ด้วย implementation จริง (ลบ todo() ทิ้ง)
  return todo('AppHeader', 1, 'LY-01');
}
