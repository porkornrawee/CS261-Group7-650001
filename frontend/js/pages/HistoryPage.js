/**
 * HistoryPage — ประวัติการจองของผู้ใช้ปัจจุบัน
 * Owner: Dev 4 | Ticket: PG-05 | Priority: P0 | Route: #/history
 * @returns {HTMLElement}
 * Page เท่านั้นที่คุยกับ js/api/* และ js/store.js ได้
 */
import { h } from '../core/dom.js';
import { PageShell } from '../components/layout/PageShell.js';
import { Alert } from '../components/ui/Alert.js';
import { Chip } from '../components/ui/Chip.js';
import { Spinner } from '../components/ui/Spinner.js';
import { ReservationTable } from '../features/history/ReservationTable.js';
import { listMyReservations } from '../api/reservations.js';
import { messageFor } from '../api/errors.js';

const filters = [
  { value: '', label: 'ทั้งหมด' },
  { value: 'completed', label: 'เสร็จสิ้น' },
  { value: 'cancelled', label: 'ยกเลิกเอง' },
  { value: 'auto_cancelled', label: 'ยกเลิกอัตโนมัติ' },
];

export function HistoryPage() {
  let selectedStatus = '';
  let requestId = 0;
  const filterBar = h('div', {
    class: 'history-page__filters',
    role: 'group',
    'aria-label': 'กรองประวัติตามสถานะ',
  });
  const results = h('div', { class: 'history-page__results' }, Spinner());

  function renderFilters() {
    filterBar.replaceChildren(...filters.map(({ value, label }) => Chip({
      label,
      selected: value === selectedStatus,
      onClick: () => {
        if (selectedStatus === value) return;
        selectedStatus = value;
        renderFilters();
        loadReservations();
      },
    })));
  }

  async function loadReservations() {
    const currentRequest = ++requestId;
    results.replaceChildren(Spinner());
    try {
      const { reservations } = await listMyReservations(selectedStatus);
      if (currentRequest !== requestId) return;
      results.replaceChildren(ReservationTable({
        reservations,
        onOpen: (code) => { window.location.hash = `#/ticket/${encodeURIComponent(code)}`; },
      }));
    } catch (error) {
      if (currentRequest === requestId) {
        results.replaceChildren(Alert({ tone: 'error', message: messageFor(error) }));
      }
    }
  }

  renderFilters();
  loadReservations();
  return PageShell({
    title: 'ประวัติการจอง',
    children: [filterBar, results],
  });
}
