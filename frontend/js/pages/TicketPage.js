/**
 * TicketPage — หน้าบัตรจอง (โหลดจากรหัสใน URL) + ReservationLookup
 * Owner: Dev 4 | Ticket: PG-04 | Priority: P0 | Route: #/ticket/:code
 * @param { { params: Record<string,string> } } ctx  พารามิเตอร์จาก URL (เช่น ticket → params.code)
 * @returns {HTMLElement}
 * Page เท่านั้นที่คุยกับ js/api/* และ js/store.js ได้ (component ใน ui/ ห้ามรู้จัก api)
 */
import { h } from '../core/dom.js';
import { PageShell } from '../components/layout/PageShell.js';
import { Alert } from '../components/ui/Alert.js';
import { Spinner } from '../components/ui/Spinner.js';
import { TicketCard } from '../features/ticket/TicketCard.js';
import { getReservation, qrUrl } from '../api/reservations.js';
import { isMock } from '../api/client.js';
import { messageFor } from '../api/errors.js';

export function TicketPage(ctx = { params: {} }) {
  const code = ctx.params.code;
  const body = h('div', null, Spinner());

  getReservation(code)
    .then(({ reservation }) => {
      // mock ไม่มีภาพ QR จริง จึงไม่ส่ง qrSrc
      body.replaceChildren(
        TicketCard({ reservation, qrSrc: isMock() ? '' : qrUrl(reservation.code) }),
        h('p', null, h('a', { href: '#/history' }, 'ดูรายการจองทั้งหมด')));
    })
    .catch((error) => {
      const message = error?.code === 'NOT_FOUND' ? 'ไม่พบรหัสการจองนี้' : messageFor(error);
      body.replaceChildren(Alert({ tone: 'error', message }), h('p', null, h('a', { href: '#/booking' }, 'กลับไปจอง')));
    });

  return PageShell({ title: 'บัตรจอง', subtitle: code, children: [body] });
}
