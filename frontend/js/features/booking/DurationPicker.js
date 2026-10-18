/**
 * DurationPicker — เลือกระยะเวลา (30 นาที, 1, 2, 3 ชม.) แล้วคำนวณเวลาสิ้นสุด
 * Owner: Dev 2 | Ticket: BK-03 | Priority: P0
 * @param { {startTime:string, valueMin:number, closeTime:string, onChange:(durationMin:number, endTime:string)=>void} } props
 * @returns {HTMLElement}
 * Done when: ปิดตัวเลือกที่ทำให้เกินเวลาปิดทำการ
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .duration-picker- ใน DurationPicker.css)
 */
import { todo } from '../../core/dom.js';

import { h } from '../../core/dom.js';

export function DurationPicker(props = {}) {
  const { startTime = '09:00', valueMin = 60, closeTime = '20:00', onChange } = props;
  const durations = [30, 60, 90, 120, 180];

  const toMinVal = (str) => {
    const [h, m] = (str || '00:00').split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const fromMinVal = (min) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const startMin = toMinVal(startTime);
  const closeMin = toMinVal(closeTime);

  const container = h('div', { class: 'duration-picker' });

  durations.forEach(min => {
    const endMin = startMin + min;
    const isDisabled = endMin > closeMin;
    const isSelected = min === valueMin;

    const btn = h('button', {
      class: `duration-picker__chip ${isSelected ? 'is-selected' : ''}`,
      type: 'button',
      disabled: isDisabled,
      onClick: () => {
        if (!isDisabled && onChange) {
          onChange(min, fromMinVal(endMin));
        }
      }
    }, min >= 60 ? `${min / 60} ชม.` : `${min} นาที`);

    container.appendChild(btn);
  });

  return container;
}