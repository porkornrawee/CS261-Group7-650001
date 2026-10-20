/**
 * ReservationLookup — ช่องค้นการจองจากรหัส (ด่านทางเข้า) + แสดงผลพบ/ไม่พบ
 * Owner: Dev 4 | Ticket: TK-02 | Priority: P1
 * @param { {busy?:boolean, result?:object|null, notFound?:boolean, onSearch:(code:string)=>void} } props
 * @returns {HTMLElement}
 * Done when: รับรหัสพิมพ์เล็กได้ (backend แปลงเป็นตัวใหญ่), ไม่พบแสดงข้อความไทย
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .reservation-lookup- ใน ReservationLookup.css)
 */
import { todo } from '../../core/dom.js';

import { h } from '../../core/dom.js';

export function ReservationLookup(props = {}) {
  const { busy = false, result = null, notFound = false, onSearch } = props;
  let inputCode = '';

  const container = h('div', { class: 'reservation-lookup' },
    h('h3', { class: 'reservation-lookup__title' }, 'ตรวจสอบรหัสการจอง'),
    h('div', { class: 'reservation-lookup__form' },
      h('input', {
        class: 'reservation-lookup__input',
        type: 'text',
        placeholder: 'กรอกรหัสการจอง (เช่น SP261019 หรือ PK-...)',
        onInput: (e) => {
          inputCode = e.target.value.toUpperCase();
        },
        onKeydown: (e) => {
          if (e.key === 'Enter' && onSearch) {
            onSearch(inputCode);
          }
        }
      }),
      h('button', {
        class: 'btn btn--primary reservation-lookup__btn',
        type: 'button',
        disabled: busy,
        onClick: () => {
          if (onSearch) {
            onSearch(inputCode);
          }
        }
      }, busy ? 'กำลังค้นหา...' : 'ค้นหา')
    )
  );

  if (notFound) {
    container.appendChild(
      h('div', { class: 'reservation-lookup__message reservation-lookup__message--error' }, 
        'ไม่พบข้อมูลการจอง กรุณาตรวจสอบรหัสใหม่อีกครั้ง'
      )
    );
  }

  if (result) {
    container.appendChild(
      h('div', { class: 'reservation-lookup__message reservation-lookup__message--success' }, 
        `พบข้อมูลการจองสำหรับรหัส: ${result.code || '-'}`
      )
    );
  }

  return container;
}