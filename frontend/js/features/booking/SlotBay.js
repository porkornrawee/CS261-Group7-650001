/**
 * SlotBay — ช่องจอด 1 ช่อง มองจากด้านบน 3 สถานะ: free / partial / booked (+ selected)
 * Owner: Dev 3 | Ticket: BK-06 | Priority: P0
 * @param { {slot:{id:number,label:string}, status:'free'|'partial'|'booked', busy?:Array<{start:string,end:string}>, selected?:boolean, onSelect:(slotId:number)=>void, kind?:'car'|'moto', facing?:'down'|'up'} } props
 * @returns {HTMLElement}
 * Done when: ช่องที่ booked ต้อง 'กดได้' ตามเดิม (ให้ Backend เป็นผู้ตัดสิน), แยกสถานะด้วยรูปรถ/ป้าย ไม่พึ่งสีอย่างเดียว
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .slot-bay- ใน SlotBay.css)
 *
 * หน้าตา: ช่องว่าง = พื้นถนนเปล่าพร้อมเลขช่องทาสีขาว · ติดจองบางช่วง = รถจาง + ป้าย ! สีเหลือง
 *         เต็ม = รถสีเทาจอดอยู่ · ที่เลือก = รถสีแดง + กรอบเรือง
 */
import { h, s } from '../../core/dom.js';

const STATUS_TEXT = { free: 'ว่าง', partial: 'ติดจอง', booked: 'เต็ม' };

/** รถยนต์มองจากด้านบน (หัวรถอยู่ด้านบนของ viewBox) */
function carTopView() {
  return s('svg', { class: 'slot-bay__vehicle', viewBox: '0 0 40 72', 'aria-hidden': 'true', focusable: 'false' },
    s('rect', { class: 'slot-bay__mirror', x: 1, y: 22, width: 5, height: 4, rx: 2 }),
    s('rect', { class: 'slot-bay__mirror', x: 34, y: 22, width: 5, height: 4, rx: 2 }),
    s('rect', { class: 'slot-bay__body', x: 4, y: 3, width: 32, height: 66, rx: 11 }),
    s('path', { class: 'slot-bay__glass', d: 'M9 20c3-3 19-3 22 0l-2 9H11z' }),
    s('rect', { class: 'slot-bay__roof', x: 10, y: 30, width: 20, height: 22, rx: 3 }),
    s('path', { class: 'slot-bay__glass', d: 'M11 53h18l2 7c-4 2-18 2-22 0z' }),
    s('rect', { class: 'slot-bay__light', x: 8, y: 5, width: 7, height: 3, rx: 1.5 }),
    s('rect', { class: 'slot-bay__light', x: 25, y: 5, width: 7, height: 3, rx: 1.5 }));
}

/** มอเตอร์ไซค์มองจากด้านบน */
function motoTopView() {
  return s('svg', { class: 'slot-bay__vehicle', viewBox: '0 0 24 60', 'aria-hidden': 'true', focusable: 'false' },
    s('rect', { class: 'slot-bay__tyre', x: 9, y: 2, width: 6, height: 14, rx: 3 }),
    s('rect', { class: 'slot-bay__tyre', x: 9, y: 44, width: 6, height: 14, rx: 3 }),
    s('rect', { class: 'slot-bay__mirror', x: 1, y: 14, width: 22, height: 3, rx: 1.5 }),
    s('rect', { class: 'slot-bay__body', x: 6, y: 16, width: 12, height: 30, rx: 6 }),
    s('rect', { class: 'slot-bay__roof', x: 8, y: 26, width: 8, height: 14, rx: 4 }));
}

export function SlotBay({
  slot, status, busy = [], selected = false, onSelect = () => {}, kind = 'car', facing = 'down',
} = {}) {
  const known = status in STATUS_TEXT;
  const stateText = known ? STATUS_TEXT[status] : '';
  const busyText = busy.map((b) => `${b.start}–${b.end}`).join(', ');
  const showVehicle = selected || status === 'booked' || status === 'partial';

  // หมายเหตุ: ช่องที่ booked ยังกดเลือกได้ (ไม่ใส่ disabled) เพื่อให้เห็นว่า Backend เป็นผู้ตัดสินจริง ไม่ใช่แค่ UI
  return h('button', {
    type: 'button',
    class: [
      'slot-bay',
      `slot-bay--${kind}`,
      `slot-bay--facing-${facing}`,
      known && `slot-bay--${status}`,
      selected && 'slot-bay--selected',
    ].filter(Boolean).join(' '),
    'data-slot': slot.id,
    'aria-pressed': String(selected),
    'aria-label': `ช่อง ${slot.label}${stateText ? ' ' + stateText : ''}${busyText ? ` (ติดจอง ${busyText} น.)` : ''}`,
    title: busyText ? `ติดจอง ${busyText} น.` : `ช่อง ${slot.label}${stateText ? ' · ' + stateText : ''}`,
    onClick: () => onSelect(slot.id),
  },
    h('span', { class: 'slot-bay__label' }, slot.label),
    showVehicle ? (kind === 'moto' ? motoTopView() : carTopView()) : null,
    status === 'partial' && !selected ? h('span', { class: 'slot-bay__badge slot-bay__badge--partial', 'aria-hidden': 'true' }, '!') : null,
    selected ? h('span', { class: 'slot-bay__badge slot-bay__badge--selected', 'aria-hidden': 'true' }, '✓') : null,
  );
}
