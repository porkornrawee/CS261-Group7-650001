/**
 * DateStrip — แถบเลือกวัน 14 วัน (วันนี้ + 13 วันถัดไป ตามโค้ดเก่า)
 * Owner: Dev 2 | Ticket: BK-01 | Priority: P0
 * @param { {value:string, days?:number, onChange:(date:string)=>void} } props
 * @returns {HTMLElement}
 * Done when: ใช้ ymd()/thaiDate() จาก core/time.js, เลื่อนแนวนอนได้บนมือถือ
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .date-strip- ใน DateStrip.css)
 */
import { h } from '../../core/dom.js';
import { ymd, thaiDate } from '../../core/time.js';
export function DateStrip({
  value = '',
  days = 14,
  onChange = () => {}
} = {}) {
  const root = h('div', { class: 'date-strip-root' });
  const list = h('div', { class: 'date-strip-list' });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let selectedDate = value || ymd(today);
  function updateSelected(date) {
    selectedDate = date;
    list.querySelectorAll('.date-strip-day').forEach((button) => {
      const isSelected = button.dataset.date === selectedDate;
      button.classList.toggle('date-strip-day--selected', isSelected);
      button.setAttribute('aria-pressed', String(isSelected));
    });
    onChange(date);
  }
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateValue = ymd(date);
    const dateText = thaiDate(dateValue);
    const button = h('button', {
      type: 'button',
      class: `date-strip-day${dateValue === selectedDate ? ' date-strip-day--selected' : ''}`,
      'aria-pressed': String(dateValue === selectedDate),
      'aria-label': `เลือกวันที่ ${dateText}`,
      onClick: () => updateSelected(dateValue)
    },
      h('span', { class: 'date-strip-day-label' }, dateText),
      h('span', { class: 'date-strip-day-number' }, String(date.getDate())),
      h('span', { class: 'date-strip-day-month' },
        date.toLocaleDateString('th-TH', { month: 'short' })
      )
    );
    button.dataset.date = dateValue;
    list.append(button);
  }
  root.append(list);
  return root;
}
