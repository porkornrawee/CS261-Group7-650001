/**
 * ReservationTable — รายการประวัติการจองของผู้ใช้
 * Owner: Dev 4 | Ticket: HS-01
 */
import { h } from '../../core/dom.js';
import { Badge } from '../../components/ui/Badge.js';
import { thaiDate } from '../../core/time.js';

const STATUS_BADGES = {
  active: { text: 'ใช้งานได้', tone: 'success' },
  checked_in: { text: 'เช็กอินแล้ว', tone: 'success' },
  completed: { text: 'เสร็จสิ้น', tone: 'success' },
  cancelled: { text: 'ยกเลิกเอง', tone: 'danger' },
  auto_cancelled: { text: 'ยกเลิกอัตโนมัติ', tone: 'warning' },
};

export function ReservationTable({ reservations = [], onOpen, onCancel, onReport } = {}) {
  const container = h('div', { class: 'reservation-table' });
  if (!reservations.length) {
    container.append(h('div', { class: 'reservation-table__empty' },
      h('p', { class: 'reservation-table__empty-text' }, 'ยังไม่มีประวัติการจองในสถานะนี้ / เมื่อจองที่จอดแล้ว รายการจะแสดงที่นี่'),
      h('p', { class: 'reservation-table__empty-hint' }, 'สามารถค้นหาและจองช่องจอดรถล่วงหน้าได้ที่หน้าจองที่จอด')
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
    const isActive = status === 'active';
    const isCancelled = status === 'cancelled' || status === 'auto_cancelled';

    const actionButtons = [];
    if (!isCancelled) {
      actionButtons.push(
        h('button', {
          class: 'btn reservation-table__btn reservation-table__btn--primary',
          type: 'button',
          onClick: () => onOpen?.(code),
        }, 'ดู QR Code')
      );
    }

    if (isActive) {
      actionButtons.push(
        h('button', {
          class: 'btn reservation-table__btn reservation-table__btn--danger',
          type: 'button',
          onClick: () => (onCancel ? onCancel(code) : onOpen?.(code)),
        }, 'ยกเลิกการจอง'),
        h('button', {
          class: 'btn reservation-table__btn reservation-table__btn--report',
          type: 'button',
          onClick: () => (onReport ? onReport(code) : alert(`แจ้งปัญหาสำหรับรหัส ${code}: มีรถอื่นจอดในช่องนี้ ระบบส่งเรื่องให้ รปภ. เรียบร้อยแล้ว`)),
        }, 'แจ้งปัญหา: มีรถอื่นจอดในช่องนี้')
      );
    }

    list.append(h('article', { class: 'reservation-table__card' },
      h('div', { class: 'reservation-table__header' },
        h('span', { class: 'reservation-table__location' }, zone || 'ที่จอดอาคาร SC 1'),
        Badge(badge),
      ),
      h('div', { class: 'reservation-table__body' },
        h('div', { class: 'reservation-table__row' }, h('span', {}, 'รหัสการจอง'), h('strong', {}, code)),
        h('div', { class: 'reservation-table__row' }, h('span', {}, 'โซน / ช่องจอด'), h('strong', {}, `${zone} · ช่อง ${slot}`)),
        h('div', { class: 'reservation-table__row' }, h('span', {}, 'วันที่'), h('strong', {}, date ? thaiDate(date) : date)),
        h('div', { class: 'reservation-table__row' }, h('span', {}, 'เวลา'), h('strong', {}, `${start} – ${end} น.`)),
      ),
      actionButtons.length ? h('div', { class: 'reservation-table__footer' }, ...actionButtons) : null
    ));
  }

  container.append(list);
  return container;
}
