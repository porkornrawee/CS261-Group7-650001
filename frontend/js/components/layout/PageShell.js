/**
 * PageShell — โครงหน้ามาตรฐาน: หัวข้อหน้า + พื้นที่เนื้อหา (ทุก Page ใช้ตัวนี้ห่อ)
 * Owner: Dev 1 | Ticket: LY-03 | Priority: P0
 * @param { {title:string, subtitle?:string, children:Node|Node[]} } props
 * @returns {HTMLElement}
 * Done when: ทุกหน้ามีระยะขอบ/ความกว้างสูงสุดเหมือนกัน
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .page-shell- ใน PageShell.css)
 */
import { todo } from '../../core/dom.js';

export function PageShell(props = {}) {
  // TODO(Dev 1): แทนที่ด้วย implementation จริง (ลบ todo() ทิ้ง)
  return todo('PageShell', 1, 'LY-03');
}
