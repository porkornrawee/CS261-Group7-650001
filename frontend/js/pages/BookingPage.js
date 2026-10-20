/**
 * BookingPage — หน้าจอง 3 ขั้น: เลือกวัน-เวลา → เลือกช่อง → ยืนยัน แล้วไป #/ticket/<code>  (ใช้ DateStrip, TimeChips, DurationPicker, ParkingLot, BookingSummary, api/zones.js, api/reservations.js)
 * Owner: Dev 3 | Ticket: PG-03 | Priority: P0 | Route: #/booking
 * @param { { params: Record<string,string> } } ctx  พารามิเตอร์จาก URL (เช่น ticket → params.code)
 * @returns {HTMLElement}
 * Page เท่านั้นที่คุยกับ js/api/* และ js/store.js ได้ (component ใน ui/ ห้ามรู้จัก api)
 */
import { h } from '../core/dom.js';
import { ymd, toMin, fromMin } from '../core/time.js';
import { PageShell } from '../components/layout/PageShell.js';
import { Alert } from '../components/ui/Alert.js';
import { Spinner } from '../components/ui/Spinner.js';
import { DateStrip } from '../features/booking/DateStrip.js';
import { TimeChips } from '../features/booking/TimeChips.js';
import { DurationPicker } from '../features/booking/DurationPicker.js';
import { ParkingLot } from '../features/booking/ParkingLot.js';
import { BookingSummary } from '../features/booking/BookingSummary.js';
import { getLayout, getAvailability } from '../api/zones.js';
import { createReservation } from '../api/reservations.js';
import { messageFor } from '../api/errors.js';
import { getState } from '../store.js';

const DEFAULT_DURATION_MIN = 60;

export function BookingPage() {
  const { student, vehicle } = getState();
  const pick = { date: ymd(new Date()), start: '', durationMin: 0, end: '', slotId: null };
  let layout = null;
  let availability = null;
  let availabilityRequest = 0; // กันคำตอบเก่าทับของใหม่ (ดูหมายเหตุใน ParkingLot.js)
  let busy = false;

  const notice = h('div', { class: 'booking-page-notice' });
  const dateSlot = h('div');
  const timeSlot = h('div');
  const durationSlot = h('div');
  const lotSlot = h('div', { class: 'booking-page-lot' });
  const summarySlot = h('div');

  if (!vehicle) {
    notice.append(Alert({ tone: 'info', message: 'ยังไม่ได้ลงทะเบียนรถ ไปลงทะเบียนที่ #/vehicle ก่อนจองเพื่อให้ทะเบียนแสดงในสรุป' }));
  }

  function slotInfo() {
    if (!layout || pick.slotId == null) return {};
    for (const zone of layout.zones) {
      const slot = zone.slots.find((s) => s.id === pick.slotId);
      if (slot) {
        const state = availability?.slots.find((s) => s.id === pick.slotId);
        return { slotLabel: slot.label, zoneName: zone.name, slotStatus: state?.status, slotBusy: state?.busy };
      }
    }
    return {};
  }

  function showError(error) {
    notice.replaceChildren(Alert({ tone: 'error', message: messageFor(error) }));
  }

  function renderLot() {
    lotSlot.replaceChildren(layout ? ParkingLot({
      zones: layout.zones,
      availability,
      selectedSlotId: pick.slotId,
      onSelectSlot: (slotId) => { pick.slotId = slotId; renderLot(); renderSummary(); },
    }) : Spinner());
  }

  function renderSummary() {
    summarySlot.replaceChildren(BookingSummary({
      summary: { date: pick.date, start: pick.start, end: pick.end, plate: vehicle?.plate, ...slotInfo() },
      busy,
      onConfirm: confirm,
    }));
  }

  async function refreshAvailability({ keepNotice = false } = {}) {
    const request = ++availabilityRequest;
    availability = null;
    if (!pick.date || !pick.start || !pick.end) { renderLot(); return; }
    try {
      const result = await getAvailability({ date: pick.date, start: pick.start, end: pick.end });
      if (request !== availabilityRequest) return;
      availability = result;
      if (!keepNotice) notice.replaceChildren();
    } catch (error) {
      if (request !== availabilityRequest) return;
      showError(error);
    }
    renderLot();
    renderSummary();
  }

  function setStart(start) {
    pick.start = start;
    const fits = toMin(start) + DEFAULT_DURATION_MIN <= toMin(layout.close_time);
    pick.durationMin = fits ? DEFAULT_DURATION_MIN : 0;
    pick.end = fits ? fromMin(toMin(start) + DEFAULT_DURATION_MIN) : '';
    durationSlot.replaceChildren(DurationPicker({
      startTime: start,
      valueMin: pick.durationMin,
      closeTime: layout.close_time,
      onChange: (durationMin, endTime) => { pick.durationMin = durationMin; pick.end = endTime; refreshAvailability(); renderSummary(); },
    }));
    refreshAvailability();
    renderSummary();
  }

  async function confirm() {
    busy = true;
    renderSummary();
    try {
      const result = await createReservation({
        user_name: student?.name || 'ผู้ใช้ทั่วไป',
        slot_id: pick.slotId,
        date: pick.date,
        start: pick.start,
        end: pick.end,
      });
      window.location.hash = `#/ticket/${encodeURIComponent(result.reservation.code)}`;
    } catch (error) {
      showError(error);
      refreshAvailability({ keepNotice: true }); // ช่องอาจถูกจองไปแล้ว ดึงสถานะล่าสุดมาแสดง
    } finally {
      busy = false;
      renderSummary();
    }
  }

  async function load() {
    try {
      layout = await getLayout();
    } catch (error) {
      lotSlot.replaceChildren();
      showError(error);
      return;
    }
    dateSlot.replaceChildren(DateStrip({
      value: pick.date,
      onChange: (date) => { pick.date = date; refreshAvailability(); renderSummary(); },
    }));
    timeSlot.replaceChildren(TimeChips({
      value: pick.start,
      openTime: layout.open_time,
      closeTime: layout.close_time,
      onChange: setStart,
    }));
    renderLot();
    renderSummary();
  }

  lotSlot.append(Spinner());
  renderSummary();
  load();

  return PageShell({
    title: 'จองที่จอดรถ',
    subtitle: 'เลือกวัน เวลา และช่องจอด แล้วกดยืนยัน',
    children: [notice, dateSlot, timeSlot, durationSlot, lotSlot, summarySlot],
  });
}
