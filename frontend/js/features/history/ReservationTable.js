/**
 * ReservationTable — ตารางรายการจองล่าสุด
 * Owner: Dev 4 | Ticket: HS-01 | Priority: P0
 * @param { {reservations:Array<{code:string,slot:string,zone:string,date:string,start:string,end:string}>, onOpen?:(code:string)=>void} } props
 * @returns {HTMLElement}
 * Done when: บนมือถือแปลงเป็นการ์ดเรียงลง ไม่ scroll แนวนอน; ว่าง = EmptyState
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .reservation-table- ใน ReservationTable.css)
 */
import { h } from '../../core/dom.js';
import { thaiDate } from '../../core/time.js';
import { EmptyState } from '../../components/ui/EmptyState.js';

export function ReservationTable({ reservations = [], onOpen = () => {} } = {}) {
  if (reservations.length === 0) {
    return EmptyState({ title: 'ยังไม่มีรายการจอง', hint: 'เมื่อจองแล้วรายการจะแสดงที่นี่' });
  }
  return h('ul', { class: 'reservation-table-list' }, reservations.map((r) =>
    h('li', { class: 'reservation-table-item' },
      h('button', { type: 'button', class: 'reservation-table-open', onClick: () => onOpen(r.code) },
        h('b', { class: 'reservation-table-code' }, r.code),
        h('span', null, `${r.slot} · ${r.zone}`),
        h('span', null, `${thaiDate(r.date)} ${r.start}–${r.end} น.`)))));
}
