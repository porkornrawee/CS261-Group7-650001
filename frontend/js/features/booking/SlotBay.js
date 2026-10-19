/**
 * SlotBay — ช่องจอด 1 ช่อง 3 สถานะ: free / partial / booked
 * Owner: Dev 3 | Ticket: BK-06 | Priority: P0
 * @param { {slot:{id:number,label:string}, status:'free'|'partial'|'booked', busy?:Array<{start:string,end:string}>, selected?:boolean, onSelect:(slotId:number)=>void} } props
 * @returns {HTMLElement}
 * Done when: ช่องที่ booked ต้อง 'กดได้' ตามเดิม (ให้ Backend เป็นผู้ตัดสิน), มีลายขีดเฉียงแยกสถานะไม่พึ่งสีอย่างเดียว
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .slot-bay- ใน SlotBay.css)
 */
import { h } from '../../core/dom.js';

// ข้อความ + ไอคอนของแต่ละสถานะ (ย้ายมาจาก STATUS_TEXT / STATUS_ICON ใน state.js เดิม)
const STATUS_TEXT = { free: 'ว่าง', partial: 'ติดจอง', booked: 'เต็ม' };
const STATUS_ICON = { free: '✓', partial: '!', booked: '✕' };

export function SlotBay({ slot, status, busy = [], selected = false, onSelect = () => {} } = {}) {
  const known = status in STATUS_TEXT;
  const stateText = known ? STATUS_TEXT[status] : '';
  const busyText = busy.map((b) => `${b.start}–${b.end}`).join(', ');

  // หมายเหตุ: ช่องที่ booked ยังกดเลือกได้ (ไม่ใส่ disabled) เพื่อให้เห็นว่า Backend เป็นผู้ตัดสินจริง ไม่ใช่แค่ UI
  return h('button', {
    type: 'button',
    class: ['slot-bay', known && `slot-bay--${status}`, selected && 'slot-bay--selected'].filter(Boolean).join(' '),
    'data-slot': slot.id,
    'aria-pressed': String(selected),
    'aria-label': `ช่อง ${slot.label}${stateText ? ' ' + stateText : ''}${busyText ? ` (ติดจอง ${busyText} น.)` : ''}`,
    title: busyText ? `ติดจอง ${busyText}` : undefined,
    onClick: () => onSelect(slot.id),
  },
    h('span', { class: 'slot-bay__icon', 'aria-hidden': 'true' }, known ? STATUS_ICON[status] : ''),
    h('span', { class: 'slot-bay__label' }, slot.label),
    h('span', { class: 'slot-bay__state' }, stateText),
  );
}
