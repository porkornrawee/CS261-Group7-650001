/**
 * TimeChips — ชิปเลือกเวลาเริ่ม ภายในเวลาเปิด-ปิดทำการ
 * Owner: Dev 2 | Ticket: BK-02 | Priority: P0
 * @param { {value:string, openTime:string, closeTime:string, stepMin?:number, onChange:(start:string)=>void} } props
 * @returns {HTMLElement}
 * Done when: ไม่แสดงเวลานอกเวลาทำการ (ค่าจาก /api/zones)
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .time-chips- ใน TimeChips.css)
 */
import { todo } from '../../core/dom.js';

export function TimeChips(props = {}) {
  // TODO(Dev 2): แทนที่ด้วย implementation จริง (ลบ todo() ทิ้ง)
  return todo('TimeChips', 2, 'BK-02');
}
