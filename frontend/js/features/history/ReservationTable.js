/**
 * ReservationTable — รายการประวัติการจองของผู้ใช้
 * Owner: Dev 4 | Ticket: HS-01
 * @param {{reservations: object[], onOpen?:(code:string)=>void}} props
 * @returns {HTMLElement}
 * Done when: แสดงรายการเป็นการ์ดที่รองรับมือถือและมี Badge สถานะ
 */
import { h } from '../../core/dom.js';
import { Badge } from '../../components/ui/Badge.js';

const STATUS_BADGES = {
  active: { text: 'กำลังใช้งาน', tone: 'success' },
  checked_in: { text: 'เช็กอินแล้ว', tone: 'success' },
  completed: { text: 'เสร็จสิ้น', tone: 'success' },
  cancelled: { text: 'ยกเลิกเอง', tone: 'danger' },
  auto_cancelled: { text: 'ยกเลิกอัตโนมัติ', tone: 'warning' },
};

export function ReservationTable({ reservations = [], onOpen } = {}) {
  const container = h('div', { class: 'reservation-table' });
  if (!reservations.length) {
    container.append(h('div', { class: 'reservation-table__empty' },
      h('p', { class: 'reservation-table__empty-text' }, 'ยังไม่มีประวัติการจองในสถานะนี้'),
    ));
    return container;
  }

  const list = h('div', { class: 'reservation-table__list' });
  for (const reservation of reservations) {
    const {
      code = '-', slot = '-', zone = '-', date = '-',
      start = '-', end = '-', status = 'active',
    } = reservation;
    const badge = STATUS_BADGES[status] || { text: 'ไม่ทราบสถานะ', tone: 'neutral' };
    list.append(h('article', { class: 'reservation-table__card' },
      h('div', { class: 'reservation-table__header' },
        h('span', { class: 'reservation-table__location' }, 'ที่จอดอาคาร SC 1'),
        Badge(badge),
      ),
      h('div', { class: 'reservation-table__body' },
        h('div', { class: 'reservation-table__row' }, h('span', {}, 'รหัสการจอง'), h('strong', {}, code)),
        h('div', { class: 'reservation-table__row' }, h('span', {}, 'โซน / ช่องจอด'), h('strong', {}, `${zone} · ${slot}`)),
        h('div', { class: 'reservation-table__row' }, h('span', {}, 'วันที่'), h('strong', {}, date)),
        h('div', { class: 'reservation-table__row' }, h('span', {}, 'เวลา'), h('strong', {}, `${start} - ${end} น.`)),
      ),
      h('div', { class: 'reservation-table__footer' },
        h('button', {
          class: 'btn reservation-table__btn',
          type: 'button',
          onClick: () => onOpen?.(code),
        }, 'ดู QR Code'),
      ),
    ));
  }

  container.append(list);
  return container;
}
