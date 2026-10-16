/**
 * SlotBay — ช่องจอด 1 ช่อง 3 สถานะ: free / partial / booked
 * Owner: Dev 3 | Ticket: BK-06 | Priority: P0
 * @param { {slot:{id:number,label:string}, status:'free'|'partial'|'booked', busy?:Array<{start:string,end:string}>, selected?:boolean, onSelect:(slotId:number)=>void} } props
 * @returns {HTMLElement}
 * Done when: ช่องที่ booked ต้อง 'กดได้' ตามเดิม (ให้ Backend เป็นผู้ตัดสิน), มีลายขีดเฉียงแยกสถานะไม่พึ่งสีอย่างเดียว
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .slot-bay- ใน SlotBay.css)
 */
import { todo } from '../../core/dom.js';

export function SlotBay(props = {}) {
  // TODO(Dev 3): แทนที่ด้วย implementation จริง (ลบ todo() ทิ้ง)
  return todo('SlotBay', 3, 'BK-06');
}
