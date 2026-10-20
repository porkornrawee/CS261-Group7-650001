/**
 * ReservationTable — ตารางรายการจองล่าสุด
 * Owner: Dev 4 | Ticket: HS-01 | Priority: P0
 * @param { {reservations:Array<{code:string,slot:string,zone:string,date:string,start:string,end:string}>, onOpen?:(code:string)=>void} } props
 * @returns {HTMLElement}
 * Done when: บนมือถือแปลงเป็นการ์ดเรียงลง ไม่ scroll แนวนอน; ว่าง = EmptyState
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .reservation-table- ใน ReservationTable.css)
 */
import { todo } from '../../core/dom.js';

import { h } from '../../core/dom.js';

export function ReservationTable(props = {}) {
  const { reservations = [], onOpen } = props;

  const container = h('div', { class: 'reservation-table' });

  // กรณีไม่มีข้อมูล (EmptyState)
  if (!reservations || reservations.length === 0) {
    const emptyBox = h('div', { class: 'reservation-table__empty' },
      h('div', { class: 'reservation-table__empty-text' }, 'ยังไม่มีประวัติการจองในระบบ')
    );
    container.appendChild(emptyBox);
    return container;
  }

  // สร้างรายการการ์ดจอง
  const listContainer = h('div', { class: 'reservation-table__list' });

  reservations.forEach(res => {
    const { code = '-', slot = '-', zone = '-', date = '-', start = '-', end = '-' } = res;

    const card = h('div', { class: 'reservation-table__card' },
      h('div', { class: 'reservation-table__header' },
        h('span', { class: 'reservation-table__location' }, 'ที่จอดอาคาร SC 1'),
        h('span', { class: 'reservation-table__badge is-active' }, 'ใช้งานได้')
      ),
      h('div', { class: 'reservation-table__body' },
        h('div', { class: 'reservation-table__row' }, h('span', {}, 'รหัสการจอง'), h('strong', {}, code)),
        h('div', { class: 'reservation-table__row' }, h('span', {}, 'โซน / ช่องจอด'), h('strong', {}, `${zone} · ${slot}`)),
        h('div', { class: 'reservation-table__row' }, h('span', {}, 'วันที่'), h('strong', {}, date)),
        h('div', { class: 'reservation-table__row' }, h('span', {}, 'เวลา'), h('strong', {}, `${start} - ${end} น.`))
      ),
      h('div', { class: 'reservation-table__footer' },
        h('button', {
          class: 'btn reservation-table__btn',
          type: 'button',
          onClick: () => onOpen && onOpen(code)
        }, 'ดู QR Code')
      )
    );

    listContainer.appendChild(card);
  });

  container.appendChild(listContainer);
  return container;
}
