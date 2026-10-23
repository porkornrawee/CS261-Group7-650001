/**
 * TicketPage — โหลดและแสดงบัตรจองจากรหัสใน URL
 * Owner: Dev 4 | Ticket: PG-04 | Priority: P0 | Route: #/ticket/:code
 * @param {{params: Record<string,string>}} ctx
 * @returns {HTMLElement}
 */
import { h } from '../core/dom.js';
import { PageShell } from '../components/layout/PageShell.js';
import { Alert } from '../components/ui/Alert.js';
import { Spinner } from '../components/ui/Spinner.js';
import { TicketCard } from '../features/ticket/TicketCard.js';
import { getReservation, qrUrl } from '../api/reservations.js';
import { messageFor } from '../api/errors.js';

export function TicketPage(ctx = { params: {} }) {
  const code = ctx.params.code;
  const body = h('div', { class: 'ticket-page__body', 'aria-busy': 'true' },
    Spinner({ label: 'กำลังโหลดบัตรจอง…' }));

  getReservation(code)
    .then((data) => {
      const { reservation, qr_data_uri, qr_url } = data;
      const qrSrc = qr_data_uri || qr_url || qrUrl(reservation.code);
      body.setAttribute('aria-busy', 'false');
      body.replaceChildren(
        TicketCard({ reservation, qrSrc }),
        h('nav', { class: 'ticket-page__links', 'aria-label': 'รายการจอง' },
          h('a', { href: '#/history' }, 'ดูรายการจองทั้งหมด'))
      );
    })
    .catch((error) => {
      const message = error?.code === 'NOT_FOUND'
        ? 'ไม่พบรหัสการจองนี้ กรุณาตรวจสอบรหัสอีกครั้ง'
        : messageFor(error);
      body.setAttribute('aria-busy', 'false');
      body.replaceChildren(
        h('h2', { class: 'ticket-page__error-title' }, 'โหลดบัตรจองไม่สำเร็จ'),
        Alert({ tone: 'error', message }),
        h('nav', { class: 'ticket-page__links', 'aria-label': 'ตัวเลือกหลังเกิดข้อผิดพลาด' },
          h('a', { href: '#/history' }, 'ดูรายการจอง'),
          h('a', { href: '#/booking' }, 'กลับไปจอง'))
      );
    });

  return PageShell({ title: 'บัตรจอง', subtitle: code, children: [body] });
}
