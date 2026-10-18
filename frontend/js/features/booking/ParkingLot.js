/**
 * ParkingLot — ผังลานจอดทั้งหมด วาดทุกโซนในตัวเอง (ไม่ต้องทำ ZoneBlock แยก)
 * Owner: Dev 3 | Ticket: BK-04 | Priority: P0
 * @param { {zones:Array<{id:number,name:string,slots:Array<{id:number,label:string}>}>, availability:{slots:Array<{id:number,status:string,busy:Array<{start:string,end:string}>}>, zones:Array<{id:number,free:number,total:number,full:boolean}>}, selectedSlotId?:number|null, onSelectSlot:(slotId:number)=>void} } props
 * @returns {HTMLElement}
 * Done when: แต่ละโซนมีหัวโซน (ชื่อ + 'ว่าง x/y' หรือป้าย 'เต็ม') ตามโค้ดเก่า parking-lot.js บรรทัด 9-13 และ 77-81; รูปแบบข้อมูลตรงกับ GET /api/zones และ /api/availability (ดู api/mock/*.json)
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .parking-lot- ใน ParkingLot.css)
 */
import { todo } from '../../core/dom.js';

import { h } from '../../core/dom.js';
import { ZoneBlock } from './ZoneBlock.js';

export function ParkingLot(props = {}) {
  const { zones = [], availability = {}, selectedSlotId, onSelectSlot } = props;
  const container = h('div', { class: 'parking-lot' },
    h('h3', { class: 'parking-lot__main-title' }, 'ผังที่จอด')
  );

  // ส่วนแสดงคำอธิบายสถานะ (Legend)
  const legendEl = h('div', { class: 'parking-lot__legend' },
    h('div', { class: 'parking-lot__legend-item' },
      h('span', { class: 'parking-lot__legend-box parking-lot__legend-box--free' }), 'ว่าง'
    ),
    h('div', { class: 'parking-lot__legend-item' },
      h('span', { class: 'parking-lot__legend-box parking-lot__legend-box--booked' }), 'ไม่ว่าง'
    ),
    h('div', { class: 'parking-lot__legend-item' },
      h('span', { class: 'parking-lot__legend-box parking-lot__legend-box--selected' }), 'ที่คุณเลือก'
    )
  );
  container.appendChild(legendEl);

  zones.forEach(zone => {
    const zoneAvail = availability.zones?.find(z => z.id === zone.id) || { free: 0, total: zone.slots.length, full: false };
    const zoneSlotsAvail = availability.slots || [];

    const zoneEl = ZoneBlock({
      zone,
      zoneAvailability: zoneAvail,
      slotsAvailability: zoneSlotsAvail,
      selectedSlotId,
      onSelectSlot
    });
    container.appendChild(zoneEl);
  });

  return container;
}
