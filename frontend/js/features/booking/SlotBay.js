/**
 * SlotBay — ช่องจอด 1 ช่อง 3 สถานะ: free / partial / booked
 * Owner: Dev 3 | Ticket: BK-06 | Priority: P0
 * @param { {slot:{id:number,label:string}, status:'free'|'partial'|'booked', busy?:Array<{start:string,end:string}>, selected?:boolean, onSelect:(slotId:number)=>void} } props
 * @returns {HTMLElement}
 * Done when: ช่องที่ booked ต้อง 'กดได้' ตามเดิม (ให้ Backend เป็นผู้ตัดสิน), มีลายขีดเฉียงแยกสถานะไม่พึ่งสีอย่างเดียว
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .slot-bay- ใน SlotBay.css)
 */
import { todo } from '../../core/dom.js';

/**
 * SlotBay — ช่องจอด 1 ช่อง (free / partial / booked)
 * Owner: Dev 3 | Ticket: BK-06 | Priority: P0
 */
import { h } from '../../core/dom.js';

export function SlotBay(props = {}) {
  const { slot, status = 'free', selected = false, onSelect } = props;

  return h('button', {
    class: `slot-bay slot-bay--${status} ${selected ? 'is-selected' : ''}`,
    type: 'button',
    onClick: () => onSelect && onSelect(slot.id)
  },
    h('span', { class: 'slot-bay__label' }, slot.label)
  );
}