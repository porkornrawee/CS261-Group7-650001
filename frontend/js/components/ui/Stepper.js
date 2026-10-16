/**
 * Stepper — หัวข้อขั้นตอนแบบมีเลข (1 เลือกเวลา → 2 เลือกช่อง → 3 ยืนยัน)
 * Owner: Dev 1 | Ticket: UI-08 | Priority: P2 (ข้ามได้ ไม่ต้องทำรอบ Demo)
 * @param { {steps:string[], current:number} } props
 * @returns {HTMLElement}
 * Done when: ขั้นที่ผ่านแล้ว/ปัจจุบัน/ยังไม่ถึง แยกสีชัด
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .stepper- ใน Stepper.css)
 */
import { todo } from '../../core/dom.js';

export function Stepper(props = {}) {
  // TODO(Dev 1): แทนที่ด้วย implementation จริง (ลบ todo() ทิ้ง)
  return todo('Stepper', 1, 'UI-08');
}
