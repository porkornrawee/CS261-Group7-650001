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
import { Card } from '../components/ui/Card.js';
import { Field } from '../components/ui/Field.js';
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

export function BookingPage() {
  // ค่าเริ่มต้น "พรุ่งนี้ 09:00–10:00" (โค้ดเก่า main.js บรรทัด 6-11)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const { student, vehicle } = getState();
  const state = {
    date: ymd(tomorrow), start: '09:00', duration: 60, end: '10:00',
    userName: student?.name || '',
    layout: null, availability: null, selectedSlotId: null, submitting: false,
  };
  let availabilityRequest = 0; // กันคำตอบเก่ามาทับของใหม่ (โค้ดเก่า parking-lot.js บรรทัด 45, 49)
  let refreshTimer;

  const timeBox = h('div', { class: 'booking-page-time' });
  const lotBox = h('div', { class: 'booking-page-lot' }, Spinner({ label: 'กำลังโหลดผังลานจอด' }));
  const lotAlert = h('div', { 'aria-live': 'polite' });
  const summaryBox = h('div');
  const submitAlert = h('div', { 'aria-live': 'polite' });
  const stack = { style: 'display:grid;gap:var(--space-4)' };

  const findSlot = (id) => {
    for (const zone of state.layout?.zones || []) {
      const slot = zone.slots.find((s) => s.id === id);
      if (slot) return { slot, zone };
    }
    return null;
  };

  function renderTime() {
    const openTime = state.layout?.open_time || '08:00';
    const closeTime = state.layout?.close_time || '20:00';
    timeBox.replaceChildren(h('div', stack,
      DateStrip({ value: state.date, onChange: (date) => { state.date = date; onTimeChange(); } }),
      TimeChips({
        value: state.start, openTime, closeTime, stepMin: 60,
        onChange: (start) => {
          state.start = start;
          state.end = fromMin(Math.min(toMin(start) + state.duration, toMin(closeTime)));
          renderTime();
          onTimeChange();
        },
      }),
      DurationPicker({
        startTime: state.start, valueMin: state.duration, closeTime,
        onChange: (duration, end) => { state.duration = duration; state.end = end; renderTime(); onTimeChange(); },
      }),
      // กรอกเวลาเองได้ (เหมือนช่อง input เดิม) ใช้ทดสอบเวลานอกทำการ TC-US7-04
      h('details', null,
        h('summary', null, 'กำหนดเวลาเอง'),
        h('div', { style: 'display:flex;flex-wrap:wrap;gap:var(--space-3);margin-top:var(--space-3)' },
          Field({ id: 'booking-start', label: 'เวลาเริ่ม', type: 'time', value: state.start,
            onInput: (v) => { state.start = v; onTimeChange(); } }),
          Field({ id: 'booking-end', label: 'เวลาสิ้นสุด', type: 'time', value: state.end,
            onInput: (v) => { state.end = v; onTimeChange(); } }))),
    ));
  }

  function renderLot() {
    if (!state.layout) return;
    lotBox.replaceChildren(ParkingLot({
      zones: state.layout.zones,
      availability: state.availability,
      selectedSlotId: state.selectedSlotId,
      onSelectSlot: (id) => { state.selectedSlotId = id; renderLot(); renderSummary(); },
    }));
  }

  function renderSummary() {
    const picked = findSlot(state.selectedSlotId);
    const slotState = state.availability?.slots.find((s) => s.id === state.selectedSlotId);
    summaryBox.replaceChildren(h('div', stack,
      Field({ id: 'booking-user-name', label: 'ชื่อผู้จอง', value: state.userName, maxLength: 100,
        placeholder: 'เช่น สมชาย ใจดี', onInput: (v) => { state.userName = v; } }),
      BookingSummary({
        summary: {
          date: state.date, start: state.start, end: state.end,
          slotLabel: picked?.slot.label, zoneName: picked?.zone.name, plate: vehicle?.plate,
          slotStatus: slotState?.status, slotBusy: slotState?.busy,
        },
        busy: state.submitting,
        onConfirm: submit,
      })));
  }

  async function refreshAvailability() {
    const ticket = ++availabilityRequest;
    if (!state.date || !state.start || !state.end) return;
    lotAlert.replaceChildren();
    try {
      const availability = await getAvailability({ date: state.date, start: state.start, end: state.end });
      if (ticket !== availabilityRequest) return; // มีคำขอใหม่กว่าแล้ว ข้ามผลเก่า
      state.availability = availability;
    } catch (error) {
      if (ticket !== availabilityRequest) return;
      state.availability = null;
      lotAlert.replaceChildren(Alert({ tone: 'error', message: messageFor(error) }));
    }
    renderLot();
    renderSummary();
  }

  function onTimeChange() {
    submitAlert.replaceChildren();
    renderSummary();
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(refreshAvailability, 250);
  }

  // ส่งจอง (โค้ดเก่า booking-form.js บรรทัด 2-29) — backend เป็นผู้ตัดสินเสมอ แม้ช่องจะแสดงว่าไม่ว่าง
  async function submit() {
    if (state.submitting || !state.selectedSlotId) return;
    state.submitting = true;
    submitAlert.replaceChildren();
    renderSummary();
    try {
      const result = await createReservation({
        user_name: state.userName, slot_id: state.selectedSlotId,
        date: state.date, start: state.start, end: state.end,
      });
      window.location.hash = `#/ticket/${encodeURIComponent(result.reservation.code)}`;
    } catch (error) {
      submitAlert.replaceChildren(Alert({ tone: 'error', message: messageFor(error) }));
      refreshAvailability();
    } finally {
      state.submitting = false;
      renderSummary();
    }
  }

  renderTime();
  renderSummary();
  getLayout()
    .then((layout) => { state.layout = layout; renderTime(); renderLot(); refreshAvailability(); })
    .catch((error) => lotBox.replaceChildren(Alert({ tone: 'error', message: messageFor(error) })));

  return PageShell({
    title: 'จองที่จอดรถ',
    subtitle: 'เลือกวันและเวลา เลือกช่องจอด แล้วกดยืนยัน',
    children: h('div', stack,
      Card({ title: '1. เลือกวันและเวลา', children: timeBox }),
      Card({ title: '2. เลือกช่องจอด', children: [lotAlert, lotBox] }),
      Card({ title: '3. ยืนยันการจอง', children: [summaryBox, submitAlert] })),
  });
}
