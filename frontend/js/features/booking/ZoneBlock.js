/**
 * ZoneBlock — กลุ่มช่องจอดของ 1 โซน + หัวโซน (ว่าง x/y หรือป้าย 'เต็ม')
 * Owner: Dev 3 | Ticket: BK-05 | Priority: P2 (ข้ามได้ ไม่ต้องทำรอบ Demo)
 * @param { {zone:{id:number,name:string}, slots:Array, zoneState:{free:number,total:number,full:boolean}, selectedSlotId?:number|null, onSelectSlot:(slotId:number)=>void} } props
 * @returns {HTMLElement}
 * Done when: หัวโซนขึ้น 'เต็ม' เมื่อ full=true (TC-US7-03)
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .zone-block- ใน ZoneBlock.css)
 */
import { todo } from '../../core/dom.js';

export function ZoneBlock(props = {}) {
  // TODO(Dev 3): แทนที่ด้วย implementation จริง (ลบ todo() ทิ้ง)
  return todo('ZoneBlock', 3, 'BK-05');
}
