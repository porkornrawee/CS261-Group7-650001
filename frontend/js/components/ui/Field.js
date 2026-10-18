/**
 * Field — ช่องกรอกข้อมูล + label + ข้อความ error ใต้ช่อง
 * Owner: Dev 1 | Ticket: UI-03 | Priority: P0
 * @param { {id:string, label:string, type?:string, value?:string, placeholder?:string, error?:string, maxLength?:number, onInput?:(value:string)=>void} } props
 * @returns {HTMLElement}
 * Done when: แสดง error เป็นสีแดงใต้ช่อง, label ผูกกับ input (a11y)
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .field- ใน Field.css)
 */
import { h } from '../../core/dom.js';
export function Field({ id, label, type = 'text', value = '', placeholder = '', error = '', maxLength, onInput } = {}) {
  return h('div', { class: 'field-root' },
    h('label', { class: 'field-label', for: id }, label),
    h('input', {
      class: `field-input${error ? ' field-input--error' : ''}`, id, type, value,
      placeholder, ...(maxLength ? { maxlength: maxLength } : {}),
      ...(onInput ? { onInput: (event) => onInput(event.target.value) } : {}),
      ...(error ? { 'aria-invalid': 'true', 'aria-describedby': `${id}-error` } : {}),
    }),
    error ? h('p', { id: `${id}-error`, class: 'field-error' }, error) : null,
  );
}
