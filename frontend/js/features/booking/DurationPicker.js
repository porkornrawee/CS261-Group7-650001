/**
 * DurationPicker — เลือกระยะเวลา (30 นาที, 1, 2, 3 ชม.) แล้วคำนวณเวลาสิ้นสุด
 * Owner: Dev 2 | Ticket: BK-03 | Priority: P0
 * @param { {startTime:string, valueMin:number, closeTime:string, onChange:(durationMin:number, endTime:string)=>void} } props
 * @returns {HTMLElement}
 * Done when: ปิดตัวเลือกที่ทำให้เกินเวลาปิดทำการ
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .duration-picker- ใน DurationPicker.css)
 */
import { todo } from '../../core/dom.js';

export function DurationPicker(props = {}) {
  // TODO(Dev 2): แทนที่ด้วย implementation จริง (ลบ todo() ทิ้ง)
  return todo('DurationPicker', 2, 'BK-03');
}
