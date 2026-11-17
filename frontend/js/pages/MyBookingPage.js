/**
 * MyBookingPage — ผังลานจอดพร้อมไฮไลต์ช่องที่ผู้ใช้จอง (US8)
 * Route: #/history/:code/slot  (ต้องล็อกอิน) — เปิดจากปุ่ม "ดูตำแหน่งบนผัง" ในรายการจอง
 * Page เท่านั้นที่คุยกับ js/api/*
 */
import { h } from '../core/dom.js';
import { thaiDate } from '../core/time.js';
import { PageShell } from '../components/layout/PageShell.js';
import { Alert } from '../components/ui/Alert.js';
import { Spinner } from '../components/ui/Spinner.js';
import { ParkingLot } from '../features/booking/ParkingLot.js';
import { getReservation } from '../api/reservations.js';
import { getLayout, getAvailability } from '../api/zones.js';
import { messageFor } from '../api/errors.js';

export function MyBookingPage(ctx = { params: {} }) {
  const code = ctx.params.code;
  const body = h('div', { class: 'my-booking-page__body', 'aria-busy': 'true' },
    Spinner({ label: 'กำลังโหลดผังลานจอด…' }));

  (async () => {
    try {
      const [{ reservation }, layout] = await Promise.all([getReservation(code), getLayout()]);
      let availability = null;
      try {
        availability = await getAvailability({
          date: reservation.date, start: reservation.start, end: reservation.end,
        });
      } catch {
        availability = null; // ผังยังแสดงได้ แม้ดึงสถานะว่างไม่สำเร็จ
      }
      body.setAttribute('aria-busy', 'false');
      body.replaceChildren(
        h('p', { class: 'my-booking-page__info', role: 'status' },
          `ช่อง ${reservation.slot} · ${reservation.zone} · ${thaiDate(reservation.date)} ${reservation.start} – ${reservation.end} น.`),
        ParkingLot({
          zones: layout.zones,
          availability,
          highlightSlotId: reservation.slot_id,
          onSelectSlot: () => {},
        }),
        h('nav', { class: 'my-booking-page__links', 'aria-label': 'ตัวเลือก' },
          h('a', { href: '#/history' }, 'กลับไปรายการจอง'),
          ' · ',
          h('a', { href: `#/ticket/${encodeURIComponent(code)}` }, 'ดูบัตรจอง')),
      );
    } catch (error) {
      body.setAttribute('aria-busy', 'false');
      body.replaceChildren(
        Alert({ tone: 'error', message: error?.code === 'NOT_FOUND' ? 'ไม่พบรหัสการจองนี้' : messageFor(error) }),
        h('a', { href: '#/history' }, 'กลับไปรายการจอง'));
    }
  })();

  return PageShell({ title: 'ตำแหน่งช่องจอดของฉัน', subtitle: code, children: [body] });
}
