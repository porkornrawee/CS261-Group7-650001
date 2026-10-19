/**
 * ParkingLot — ผังลานจอดทั้งหมด วาดทุกโซนในตัวเอง (ไม่ต้องทำ ZoneBlock แยก)
 * Owner: Dev 3 | Ticket: BK-04 | Priority: P0
 * @param { {zones:Array<{id:number,name:string,slots:Array<{id:number,label:string}>}>, availability:{slots:Array<{id:number,status:string,busy:Array<{start:string,end:string}>}>, zones:Array<{id:number,free:number,total:number,full:boolean}>}, selectedSlotId?:number|null, onSelectSlot:(slotId:number)=>void} } props
 * @returns {HTMLElement}
 * Done when: แต่ละโซนมีหัวโซน (ชื่อ + 'ว่าง x/y' หรือป้าย 'เต็ม') ตามโค้ดเก่า parking-lot.js บรรทัด 9-13 และ 77-81; รูปแบบข้อมูลตรงกับ GET /api/zones และ /api/availability (ดู api/mock/*.json)
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .parking-lot- ใน ParkingLot.css)
 * หมายเหตุ: availability เป็น null ได้ (ระหว่างโหลด/เวลาไม่ถูกต้อง) ช่องจะแสดงแบบไม่มีสถานะ
 *   ตัวนับกันคำตอบเก่าทับของใหม่ (availabilityRequest เดิม) อยู่ที่ BookingPage เพราะ component นี้ไม่ fetch เอง
 */
import { h } from '../../core/dom.js';
import { SlotBay } from './SlotBay.js';

const LEGEND = [
  { key: 'free', text: 'ว่าง' },
  { key: 'partial', text: 'ติดจอง (บางช่วง)' },
  { key: 'booked', text: 'เต็ม (ตลอดช่วง)' },
];

export function ParkingLot({ zones = [], availability = null, selectedSlotId = null, onSelectSlot = () => {} } = {}) {
  const slotState = new Map((availability?.slots || []).map((s) => [s.id, s]));
  const zoneState = new Map((availability?.zones || []).map((z) => [z.id, z]));

  // นับจำนวนแต่ละสถานะสำหรับแถบสัญลักษณ์ (โค้ดเก่าบรรทัด 57, 67, 75)
  const totals = { free: 0, partial: 0, booked: 0 };
  for (const s of slotState.values()) {
    // เผื่อ API รุ่นเก่าที่ยังไม่มี status: booked = ไม่ว่าง
    const status = s.status || (s.booked ? 'booked' : 'free');
    if (status in totals) totals[status]++;
  }

  const zoneEls = zones.map((zone) => {
    const state = zoneState.get(zone.id);
    const count = state
      ? h('span', { class: `parking-lot__count parking-lot__count--${state.full ? 'full' : 'ok'}` },
          state.full ? 'เต็ม' : `ว่าง ${state.free}/${state.total}`)
      : null;

    return h('section', { class: 'parking-lot__zone', 'data-zone': zone.id, role: 'group', 'aria-label': zone.name },
      h('div', { class: 'parking-lot__head' },
        h('h3', { class: 'parking-lot__name' }, zone.name),
        count),
      h('div', { class: 'parking-lot__bays' }, zone.slots.map((slot) => {
        const s = slotState.get(slot.id);
        return SlotBay({
          slot,
          status: s ? s.status || (s.booked ? 'booked' : 'free') : undefined,
          busy: s?.busy || [],
          selected: slot.id === selectedSlotId,
          onSelect: onSelectSlot,
        });
      })));
  });

  const legend = h('ul', { class: 'parking-lot__legend', 'aria-label': 'สัญลักษณ์' },
    LEGEND.map(({ key, text }) => h('li', { class: 'parking-lot__legend-item' },
      h('span', { class: `parking-lot__dot parking-lot__dot--${key}`, 'aria-hidden': 'true' }),
      text,
      h('b', { class: 'parking-lot__n' }, availability ? totals[key] : '–'))));

  return h('div', { class: 'parking-lot' }, zoneEls, legend);
}
