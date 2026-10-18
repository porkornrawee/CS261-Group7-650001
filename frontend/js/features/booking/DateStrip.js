/**
 * DateStrip — แถบเลือกวัน 14 วัน (วันนี้ + 13 วันถัดไป ตามโค้ดเก่า)
 * Owner: Dev 2 | Ticket: BK-01 | Priority: P0
 * @param { {value:string, days?:number, onChange:(date:string)=>void} } props
 * @returns {HTMLElement}
 * Done when: ใช้ ymd()/thaiDate() จาก core/time.js, เลื่อนแนวนอนได้บนมือถือ
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .date-strip- ใน DateStrip.css)
 */
import { todo } from '../../core/dom.js';

import { h } from '../../core/dom.js';

export function DateStrip(props = {}) {
  const { value, days = 14, onChange } = props;
  const container = h('div', { class: 'date-strip' });

  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayNum = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${dayNum}`;
    
    const isSelected = dateStr === value;

    // แปลงชื่อย่อวันในสัปดาห์เป็นภาษาไทย
    const weekdays = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
    const dayOfWeek = weekdays[d.getDay()];

    const btn = h('button', {
      class: `date-strip__item ${isSelected ? 'is-selected' : ''}`,
      type: 'button',
      onClick: () => onChange && onChange(dateStr)
    },
      h('span', { class: 'date-strip__day' }, dayOfWeek),
      h('span', { class: 'date-strip__num' }, dayNum)
    );
    container.appendChild(btn);
  }

  return container;
}
