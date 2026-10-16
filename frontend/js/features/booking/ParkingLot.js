/**
 * ParkingLot — ผังลานจอดทั้งหมด วาดทุกโซนในตัวเอง (ไม่ต้องทำ ZoneBlock แยก)
 * Owner: Dev 3 | Ticket: BK-04 | Priority: P0
 * @param { {zones:Array<{id:number,name:string,slots:Array<{id:number,label:string}>}>, availability:{slots:Array<{id:number,status:string,busy:Array<{start:string,end:string}>}>, zones:Array<{id:number,free:number,total:number,full:boolean}>}, selectedSlotId?:number|null, onSelectSlot:(slotId:number)=>void} } props
 * @returns {HTMLElement}
 * Done when: แต่ละโซนมีหัวโซน (ชื่อ + 'ว่าง x/y' หรือป้าย 'เต็ม') ตามโค้ดเก่า parking-lot.js บรรทัด 9-13 และ 77-81; รูปแบบข้อมูลตรงกับ GET /api/zones และ /api/availability (ดู api/mock/*.json)
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .parking-lot- ใน ParkingLot.css)
 */
import { todo } from '../../core/dom.js';

export function ParkingLot(props = {}) {
  // TODO(Dev 3): แทนที่ด้วย implementation จริง (ลบ todo() ทิ้ง)
  return todo('ParkingLot', 3, 'BK-04');
}
