/**
 * HistoryPage — หน้ารายการจองล่าสุด (ReservationTable)
 * Owner: Dev 4 | Ticket: PG-05 | Priority: P0 | Route: #/history
 * @param { { params: Record<string,string> } } ctx  พารามิเตอร์จาก URL (เช่น ticket → params.code)
 * @returns {HTMLElement}
 * Page เท่านั้นที่คุยกับ js/api/* และ js/store.js ได้ (component ใน ui/ ห้ามรู้จัก api)
 */
import { h } from '../core/dom.js';
import { PageShell } from '../components/layout/PageShell.js';
import { Alert } from '../components/ui/Alert.js';
import { Spinner } from '../components/ui/Spinner.js';
import { ReservationTable } from '../features/history/ReservationTable.js';
import { listReservations } from '../api/reservations.js';
import { messageFor } from '../api/errors.js';

export function HistoryPage() {
  const body = h('div', null, Spinner());

  listReservations()
    .then(({ reservations }) => {
      body.replaceChildren(ReservationTable({
        reservations,
        onOpen: (code) => { window.location.hash = `#/ticket/${encodeURIComponent(code)}`; },
      }));
    })
    .catch((error) => body.replaceChildren(Alert({ tone: 'error', message: messageFor(error) })));

  return PageShell({ title: 'รายการจองล่าสุด', children: [body] });
}
