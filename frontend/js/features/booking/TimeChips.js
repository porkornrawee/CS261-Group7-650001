/**
 * TimeChips — ชิปเลือกเวลาเริ่ม ภายในเวลาเปิด-ปิดทำการ
 * Owner: Dev 2 | Ticket: BK-02 | Priority: P0
 * @param { {value:string, openTime:string, closeTime:string, stepMin?:number, onChange:(start:string)=>void} } props
 * @returns {HTMLElement}
 * Done when: ไม่แสดงเวลานอกเวลาทำการ (ค่าจาก /api/zones)
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .time-chips- ใน TimeChips.css)
 */
import { h } from '../../core/dom.js';
import { toMin, fromMin } from '../../core/time.js';

<<<<<<< HEAD
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
=======
export function TimeChips({
  value = '',
  openTime = '06:00',
  closeTime = '22:00',
  stepMin = 30,
  onChange = () => {}
} = {}) {
  const root = h('div', { class: 'time-chips-root' });

  const title = h(
    'h3',
    { class: 'time-chips-title' },
    'เลือกเวลาเริ่มจอด'
  );
  const list = h('div', {
    class: 'time-chips-list',
    role: 'group',
    'aria-label': 'เลือกเวลาเริ่มจอด'
  });
  const startMin = toMin(openTime);
  const endMin = toMin(closeTime);
  let selectedTime = value;
  function updateSelected(time) {
    selectedTime = time;
    list.querySelectorAll('.time-chips-item').forEach((button) => {
      const isSelected = button.dataset.time === selectedTime;
      button.classList.toggle(
        'time-chips-item--selected',
        isSelected
      );
      button.setAttribute('aria-pressed', String(isSelected));
    });

    onChange(time);
  }
  // ป้องกันการวนลูปไม่สิ้นสุด
  const interval = Number(stepMin);
  if (!Number.isFinite(interval) || interval <= 0) {
    throw new Error('stepMin ต้องเป็นตัวเลขที่มากกว่า 0');
  }
  if (endMin > startMin) {
    for (let minutes = startMin; minutes < endMin; minutes += interval) {
      const time = fromMin(minutes);
      const isSelected = time === selectedTime;

      const button = h(
        'button',
        {
          type: 'button',
          class: `time-chips-item${isSelected ? ' time-chips-item--selected' : ''}`,
          'aria-pressed': String(isSelected),
          onClick: () => updateSelected(time)
        },
        `${time} น.`
      );

      button.dataset.time = time;
      list.append(button);
    }
  }
  if (list.children.length === 0) {
    list.append(
      h(
        'p',
        { class: 'time-chips-empty' },
        'ไม่มีเวลาให้เลือก'
      )
    );
  }
  root.append(title, list);
  return root;
}
>>>>>>> aa44b643c34aa464431b0ca8f58b532830b82c84
