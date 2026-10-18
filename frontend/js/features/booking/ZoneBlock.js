/**
 * ZoneBlock — กลุ่มช่องจอดของ 1 โซน + หัวโซน (ว่าง x/y หรือป้าย 'เต็ม')
 * Owner: Dev 3 | Ticket: BK-05 | Priority: P2 (ข้ามได้ ไม่ต้องทำรอบ Demo)
 * @param { {zone:{id:number,name:string}, slots:Array, zoneState:{free:number,total:number,full:boolean}, selectedSlotId?:number|null, onSelectSlot:(slotId:number)=>void} } props
 * @returns {HTMLElement}
 * Done when: หัวโซนขึ้น 'เต็ม' เมื่อ full=true (TC-US7-03)
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .zone-block- ใน ZoneBlock.css)
 */
import { todo } from '../../core/dom.js';

/**
 * ZoneBlock — กลุ่มช่องจอดของ 1 โซน + หัวโซน
 * Owner: Dev 3 | Ticket: BK-05 | Priority: P2
 */
import { h } from '../../core/dom.js';
import { SlotBay } from './SlotBay.js';

export function ZoneBlock(props = {}) {
  const { zone, zoneAvailability = {}, slotsAvailability = [], selectedSlotId, onSelectSlot } = props;

  const container = h('div', { class: 'zone-block' },
    h('div', { class: 'zone-block__header' },
      h('h4', { class: 'zone-block__title' }, zone.name),
      h('span', { class: `zone-block__status ${zoneAvailability.full ? 'zone-block__status--full' : ''}` }, 
        zoneAvailability.full ? 'เต็ม' : `ว่าง ${zoneAvailability.free}/${zoneAvailability.total}`
      )
    )
  );

  const slotsContainer = h('div', { class: 'zone-block__slots' });
  (zone.slots || []).forEach(slot => {
    const slotInfo = slotsAvailability.find(s => s.id === slot.id) || { status: 'free' };
    const isSelected = slot.id === selectedSlotId;

    const bay = SlotBay({
      slot,
      status: slotInfo.status,
      selected: isSelected,
      onSelect: (id) => onSelectSlot && onSelectSlot(id)
    });
    slotsContainer.appendChild(bay);
  });

  container.appendChild(slotsContainer);
  return container;
}
