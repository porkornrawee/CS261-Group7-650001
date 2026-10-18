/**
 * DurationPicker — เลือกระยะเวลา (30 นาที, 1, 2, 3 ชม.) แล้วคำนวณเวลาสิ้นสุด
 * Owner: Dev 2 | Ticket: BK-03 | Priority: P0
 * @param { {startTime:string, valueMin:number, closeTime:string, onChange:(durationMin:number, endTime:string)=>void} } props
 * @returns {HTMLElement}
 * Done when: ปิดตัวเลือกที่ทำให้เกินเวลาปิดทำการ
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .duration-picker- ใน DurationPicker.css)
 */
import { h } from '../../core/dom.js';
import { toMin, fromMin, durationText } from '../../core/time.js';

const durations = [30, 60, 120, 180];
export function DurationPicker({
  startTime = '09:00',
  valueMin = 60,
  closeTime = '22:00',
  onChange = () => {}
} = {}) {
  const root = h('div', { class: 'duration-picker-root' });
  const title = h(
    'h3',
    { class: 'duration-picker-title' },
    'เลือกระยะเวลาจอด'
  );
  const options = h('div', {
    class: 'duration-picker-options',
    role: 'group',
    'aria-label': 'เลือกระยะเวลาจอด'
  });
  let selectedDuration = valueMin;
  function updateSelected(duration) {
    selectedDuration = duration;
    const endTime = fromMin(toMin(startTime) + duration);
    options.querySelectorAll('.duration-picker-option').forEach((button) => {
      const isSelected = Number(button.dataset.duration) === selectedDuration;
      button.classList.toggle(
        'duration-picker-option--selected',
        isSelected
      );
      button.setAttribute('aria-pressed', String(isSelected));
    });
    result.textContent = `เวลาสิ้นสุด ${endTime} น.`;
    onChange(duration, endTime);
  }
  for (const duration of durations) {
    const endMinutes = toMin(startTime) + duration;
    const isDisabled = endMinutes > toMin(closeTime);
    const isSelected = duration === selectedDuration && !isDisabled;
    const button = h(
      'button',
      {
        type: 'button',
        class: `duration-picker-option${isSelected ? ' duration-picker-option--selected' : ''}`,
        disabled: isDisabled,
        'aria-pressed': String(isSelected),
        onClick: () => {
          if (!isDisabled) {
            updateSelected(duration);
          }
        }
      },
      durationText(duration)
    );
    button.dataset.duration = String(duration);
    options.append(button);
  }
  const initialEnd = toMin(startTime) + selectedDuration;
  const initialValid =
    durations.includes(selectedDuration) &&
    initialEnd <= toMin(closeTime);
  const result = h(
    'p',
    { class: 'duration-picker-result', 'aria-live': 'polite' },
    initialValid
      ? `เวลาสิ้นสุด ${fromMin(initialEnd)} น.`
      : 'กรุณาเลือกระยะเวลาที่ไม่เกินเวลาปิดทำการ'
  );
  root.append(title, options, result);
  return root;
}


