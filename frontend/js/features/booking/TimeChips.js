/**
 * TimeChips — ชิปเลือกเวลาเริ่ม ภายในเวลาเปิด-ปิดทำการ
 * Owner: Dev 2 | Ticket: BK-02 | Priority: P0
 * @param { {value:string, openTime:string, closeTime:string, stepMin?:number, onChange:(start:string)=>void} } props
 * @returns {HTMLElement}
 * Done when: ไม่แสดงเวลานอกเวลาทำการ (ค่าจาก /api/zones)
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .time-chips- ใน TimeChips.css)
 */
import { todo } from '../../core/dom.js';

/**
 * TimeChips — ชิปเลือกเวลาเริ่ม
 * Owner: Dev 2 | Ticket: BK-02 | Priority: P0
 */
import { h } from '../../core/dom.js';

export function TimeChips(props = {}) {
  const { openTime = '08:00', closeTime = '20:00', value = '09:00', onChange } = props;
  const container = h('div', { class: 'time-chips' });

  const toMinVal = (str) => {
    const [h, m] = (str || '00:00').split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const fromMinVal = (min) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const startMin = toMinVal(openTime);
  const endMin = toMinVal(closeTime);

  for (let m = startMin; m < endMin; m += 60) {
    const timeStr = fromMinVal(m);
    const isSelected = timeStr === value;

    const chip = h('button', {
      class: `time-chips__item ${isSelected ? 'is-selected' : ''}`,
      type: 'button',
      onClick: () => onChange && onChange(timeStr)
    }, timeStr);

    container.appendChild(chip);
  }

  return container;
}