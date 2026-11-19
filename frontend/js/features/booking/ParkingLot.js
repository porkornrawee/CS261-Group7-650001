/**
 * ParkingLot — ผังลานจอดแบบมองจากด้านบน วาดทุกโซนในตัวเอง (ไม่ต้องทำ ZoneBlock แยก)
 * Owner: Dev 3 | Ticket: BK-04 | Priority: P0
 * @param { {zones:Array<{id:number,name:string,slots:Array<{id:number,label:string}>}>, availability:{slots:Array<{id:number,status:string,busy:Array<{start:string,end:string}>}>, zones:Array<{id:number,free:number,total:number,full:boolean}>}, selectedSlotId?:number|null, highlightSlotId?:number|null, onSelectSlot:(slotId:number)=>void} } props
 * @returns {HTMLElement}
 * Done when: แต่ละโซนมีหัวโซน (ชื่อ + 'ว่าง x/y' หรือป้าย 'เต็ม'); รูปแบบข้อมูลตรงกับ GET /api/zones และ /api/availability (ดู api/mock/*.json)
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .parking-lot- ใน ParkingLot.css)
 * หมายเหตุ: availability เป็น null ได้ (ระหว่างโหลด/เวลาไม่ถูกต้อง) ช่องจะแสดงแบบไม่มีสถานะ
 *   ตัวนับกันคำตอบเก่าทับของใหม่ (availabilityRequest เดิม) อยู่ที่ BookingPage เพราะ component นี้ไม่ fetch เอง
 *
 * ผัง 1 โซน: ทางเท้า → แถวช่องจอด (หันหัวลง) → ทางวิ่งรถ + ป้ายทางเข้า → แถวช่องจอด (หันหัวขึ้น)
 * ถ้าช่องเยอะเกิน 2 แถว จะต่อเป็นชุดใหม่คั่นด้วยเกาะกลาง
 */
import { h } from '../../core/dom.js';
import { SlotBay } from './SlotBay.js';
import { Icon } from '../../components/ui/Icon.js';

const MAX_PER_ROW = 8;

const LEGEND = [
  { key: 'free', text: 'ว่าง' },
  { key: 'partial', text: 'ติดจองบางช่วง' },
  { key: 'booked', text: 'เต็มตลอดช่วง' },
  { key: 'selected', text: 'ที่คุณเลือก' },
];
const LEGEND_HIGHLIGHT = { key: 'highlighted', text: 'ช่องที่คุณจอง' };

/** ชนิดรถของโซน: A = รถยนต์, B = มอเตอร์ไซค์, C = รถไฟฟ้า (ถ้าชื่อโซนระบุชนิดไว้ชัด ใช้ตามชื่อก่อน) */
export function zoneKind(zone) {
  const name = zone?.name || '';
  if (/มอเตอร์ไซค์|จักรยานยนต์|motor/i.test(name)) return 'moto';
  if (/รถไฟฟ้า|\bEV\b/i.test(name) && !/รถยนต์\s*\/\s*EV/i.test(name)) return 'ev';
  if (/โซน\s*B\b/i.test(name)) return 'moto';
  if (/โซน\s*C\b/i.test(name)) return 'ev';
  return 'car';
}

export const KIND_LABEL = { car: 'รถยนต์', moto: 'มอเตอร์ไซค์', ev: 'รถไฟฟ้า' };
export const KIND_VEHICLE_TYPE = { car: 'car', moto: 'motorcycle', ev: 'ev' };

function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

function lane(withEntrance) {
  return h('div', { class: 'parking-lot__lane', 'aria-hidden': 'true' },
    withEntrance ? h('span', { class: 'parking-lot__entrance' }, 'ทางเข้า') : null,
    h('span', { class: 'parking-lot__arrow' }, Icon('arrow-right', { size: 18 })),
    h('span', { class: 'parking-lot__arrow' }, Icon('arrow-right', { size: 18 })));
}

export function ParkingLot({ zones = [], availability = null, selectedSlotId = null, highlightSlotId = null, onSelectSlot = () => {} } = {}) {
  const slotState = new Map((availability?.slots || []).map((s) => [s.id, s]));
  const zoneState = new Map((availability?.zones || []).map((z) => [z.id, z]));

  const totals = { free: 0, partial: 0, booked: 0, selected: selectedSlotId ? 1 : 0 };
  for (const s of slotState.values()) {
    // เผื่อ API รุ่นเก่าที่ยังไม่มี status: booked = ไม่ว่าง
    const status = s.status || (s.booked ? 'booked' : 'free');
    if (status in totals) totals[status]++;
  }

  const zoneEls = zones.map((zone) => {
    const state = zoneState.get(zone.id);
    const kind = zoneKind(zone);
    const count = state
      ? h('span', { class: `parking-lot__count parking-lot__count--${state.full ? 'full' : 'ok'}` },
          state.full ? 'เต็ม' : `ว่าง ${state.free}/${state.total}`)
      : null;

    const bay = (slot, facing) => {
      const s = slotState.get(slot.id);
      return SlotBay({
        slot,
        kind,
        facing,
        status: s ? s.status || (s.booked ? 'booked' : 'free') : undefined,
        busy: s?.busy || [],
        selected: slot.id === selectedSlotId,
        highlighted: highlightSlotId != null && slot.id === highlightSlotId,
        onSelect: onSelectSlot,
      });
    };

    const perRow = Math.min(MAX_PER_ROW, Math.max(1, Math.ceil(zone.slots.length / 2)));
    const rows = chunk(zone.slots, perRow);
    const blocks = [];
    for (let i = 0; i < rows.length; i += 2) {
      if (i > 0) blocks.push(h('div', { class: 'parking-lot__median', 'aria-hidden': 'true' }));
      blocks.push(
        h('div', { class: 'parking-lot__row parking-lot__row--top', style: `--cols:${perRow}` },
          rows[i].map((slot) => bay(slot, 'down'))),
        lane(i === 0),
      );
      if (rows[i + 1]) {
        blocks.push(h('div', { class: 'parking-lot__row parking-lot__row--bottom', style: `--cols:${perRow}` },
          rows[i + 1].map((slot) => bay(slot, 'up'))));
      }
    }

    return h('section', { class: `parking-lot__zone parking-lot__zone--${kind}`, 'data-zone': zone.id, role: 'group', 'aria-label': zone.name },
      h('div', { class: 'parking-lot__head' },
        h('h3', { class: 'parking-lot__name' }, zone.name, h('span', { class: 'parking-lot__kind' }, ` · ${KIND_LABEL[kind]}`)),
        count),
      h('div', { class: 'parking-lot__site' },
        h('div', { class: 'parking-lot__walkway', 'aria-hidden': 'true' }, h('span', null, 'ทางเท้าคนเดิน')),
        blocks));
  });

  const legend = h('ul', { class: 'parking-lot__legend', 'aria-label': 'สัญลักษณ์' },
    (highlightSlotId != null ? [...LEGEND, LEGEND_HIGHLIGHT] : LEGEND).map(({ key, text }) => h('li', { class: 'parking-lot__legend-item' },
      h('span', { class: `parking-lot__swatch parking-lot__swatch--${key}`, 'aria-hidden': 'true' }),
      text,
      h('b', { class: 'parking-lot__n' }, key === 'highlighted' ? 1 : availability || key === 'selected' ? totals[key] : '–'))));

  return h('div', { class: 'parking-lot' }, legend, zoneEls);
}
