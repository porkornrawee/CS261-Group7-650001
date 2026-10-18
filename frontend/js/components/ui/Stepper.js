/**
 * Stepper — หัวข้อขั้นตอนแบบมีเลข (1 เลือกเวลา → 2 เลือกช่อง → 3 ยืนยัน)
 * Owner: Dev 1 | Ticket: UI-08 | Priority: P2 (ข้ามได้ ไม่ต้องทำรอบ Demo)
 * @param { {steps:string[], current:number} } props
 * @returns {HTMLElement}
 * Done when: ขั้นที่ผ่านแล้ว/ปัจจุบัน/ยังไม่ถึง แยกสีชัด
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .stepper- ใน Stepper.css)
 */
import { h } from '../../core/dom.js';
export function Stepper({ steps = [], current = 0 } = {}) {
  return h('ol', { class: 'stepper-root' }, steps.map((step, i) =>
    h('li', { class: `stepper-item${i === current ? ' stepper-item--current' : ''}${i < current ? ' stepper-item--done' : ''}` },
      h('span', null, i + 1), step)));
}