/**
 * BookingPage — หน้าจอง: เลือกวัน-เวลา (พร้อม toggle เช้า/บ่าย) → เลือกประเภทรถ → เลือกช่อง → กรอกทะเบียน → ยืนยัน
 * ข้อมูลทั้งหมดมาจาก API จริง (GET /api/zones, /api/availability, POST /api/reservations)
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
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const { student, vehicle } = getState();
  const state = {
    date: ymd(tomorrow),
    start: '09:00',
    duration: 60,
    end: '10:00',
    period: 'morning', // 'morning' (08:00-12:00) | 'afternoon' (12:00-20:00)
    vehicleType: 'car', // 'car' | 'motorcycle' | 'ev'
    userName: student?.name || '',
    plate: vehicle?.plate || '',
    plateError: '',
    layout: null,
    availability: null,
    selectedSlotId: null,
    submitting: false,
  };

  let availabilityRequest = 0;
  let refreshTimer;

  const timeBox = h('div', { class: 'booking-page-time' });
  const lotBox = h('div', { class: 'booking-page-lot' }, Spinner({ label: 'กำลังโหลดผังลานจอด' }));
  const lotAlert = h('div', { 'aria-live': 'polite' });
  const summaryBox = h('div');
  const submitAlert = h('div', { 'aria-live': 'polite' });
  const stack = { style: 'display:grid;gap:var(--space-4)' };

  const VEHICLE_TYPES = [
    { id: 'car', label: '🚗 รถยนต์' },
    { id: 'motorcycle', label: '🏍️ มอเตอร์ไซค์' },
    { id: 'ev', label: '⚡ รถไฟฟ้า EV' },
  ];

  // ทะเบียนรถไทย: [เลข 1 หลัก] + พยัญชนะ 1-3 ตัว + [เว้นวรรค] + ตัวเลข 1-4 หลัก เช่น กข 1234, 1กข 1234
  // ตรวจฝั่งหน้าเว็บก่อนส่ง; ถ้า backend ตอบ INVALID_PLATE ก็แสดงใต้ช่องเดียวกัน
  const PLATE_RE = /^[0-9]?[ก-ฮ]{1,3} ?[0-9]{1,4}$/;
  const normalizePlate = (value) => value.replace(/\s+/g, ' ').trim();
  const plateErrorFor = (value) => {
    const plate = normalizePlate(value);
    if (!plate) return 'กรุณากรอกทะเบียนรถ';
    if (!PLATE_RE.test(plate)) return 'รูปแบบทะเบียนรถไม่ถูกต้อง (ตัวอย่าง: กข 1234 หรือ 1กข 1234)';
    return '';
  };

  const findSlot = (id) => {
    for (const zone of state.layout?.zones || []) {
      const slot = zone.slots.find((s) => s.id === id);
      if (slot) return { slot, zone };
    }
    return null;
  };

  function renderTime() {
    const defaultOpen = '08:00';
    const defaultClose = '20:00';
    const openTime = state.period === 'morning' ? (state.layout?.open_time || defaultOpen) : '12:00';
    const closeTime = state.period === 'morning' ? '12:00' : (state.layout?.close_time || defaultClose);

    // Toggle เช้า / บ่าย
    const periodToggle = h('div', { style: 'display:flex;gap:var(--space-2);margin-bottom:var(--space-3)' },
      h('button', {
        type: 'button',
        class: `chip-root${state.period === 'morning' ? ' chip-root--selected' : ''}`,
        onClick: () => {
          if (state.period !== 'morning') {
            state.period = 'morning';
            state.start = '09:00';
            state.end = fromMin(Math.min(toMin(state.start) + state.duration, toMin('12:00')));
            renderTime();
            onTimeChange();
          }
        }
      }, '☀️ ช่วงเช้า (08:00 - 12:00)'),
      h('button', {
        type: 'button',
        class: `chip-root${state.period === 'afternoon' ? ' chip-root--selected' : ''}`,
        onClick: () => {
          if (state.period !== 'afternoon') {
            state.period = 'afternoon';
            state.start = '13:00';
            state.end = fromMin(Math.min(toMin(state.start) + state.duration, toMin(state.layout?.close_time || defaultClose)));
            renderTime();
            onTimeChange();
          }
        }
      }, '⛅ ช่วงบ่าย (12:00 - 20:00)')
    );

    // Vehicle Type Segmented Control
    const vehicleTypeControl = h('div', { style: 'display:grid;gap:var(--space-2);margin-top:var(--space-2)' },
      h('label', { style: 'font-weight:700;font-size:0.95rem;color:var(--ink)' }, 'ประเภทพาหนะ'),
      h('div', { style: 'display:flex;flex-wrap:wrap;gap:var(--space-2)' },
        VEHICLE_TYPES.map((t) => h('button', {
          type: 'button',
          class: `chip-root${state.vehicleType === t.id ? ' chip-root--selected' : ''}`,
          onClick: () => {
            state.vehicleType = t.id;
            renderTime();
            renderSummary();
          }
        }, t.label))
      )
    );

    timeBox.replaceChildren(h('div', stack,
      DateStrip({ value: state.date, onChange: (date) => { state.date = date; onTimeChange(); } }),
      periodToggle,
      TimeChips({
        value: state.start,
        openTime,
        closeTime,
        stepMin: 60,
        onChange: (start) => {
          state.start = start;
          state.end = fromMin(Math.min(toMin(start) + state.duration, toMin(state.layout?.close_time || defaultClose)));
          renderTime();
          onTimeChange();
        },
      }),
      DurationPicker({
        startTime: state.start,
        valueMin: state.duration,
        closeTime: state.layout?.close_time || defaultClose,
        onChange: (duration, end) => {
          state.duration = duration;
          state.end = end;
          renderTime();
          onTimeChange();
        },
      }),
      vehicleTypeControl,
      h('details', null,
        h('summary', { style: 'cursor:pointer;color:var(--primary);font-weight:600' }, 'กำหนดเวลาและช่องทางเลือกเอง'),
        h('div', { style: 'display:flex;flex-wrap:wrap;gap:var(--space-3);margin-top:var(--space-3)' },
          Field({ id: 'booking-start', label: 'เวลาเริ่ม', type: 'time', value: state.start,
            onInput: (v) => { state.start = v; onTimeChange(); } }),
          Field({ id: 'booking-end', label: 'เวลาสิ้นสุด', type: 'time', value: state.end,
            onInput: (v) => { state.end = v; onTimeChange(); } })
        )
      )
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
    const vehicleTypeLabel = VEHICLE_TYPES.find((v) => v.id === state.vehicleType)?.label || 'รถยนต์';

    summaryBox.replaceChildren(h('div', stack,
      Field({
        id: 'booking-user-name',
        label: 'ชื่อผู้จอง',
        value: state.userName,
        maxLength: 100,
        placeholder: 'เช่น สมชาย ใจดี',
        onInput: (v) => { state.userName = v; }
      }),
      Field({
        id: 'booking-plate',
        label: 'ทะเบียนรถ',
        value: state.plate,
        maxLength: 20,
        placeholder: 'เช่น กข 1234 หรือ 1กข 1234',
        error: state.plateError,
        onInput: (v) => { state.plate = v; }
      }),
      BookingSummary({
        summary: {
          date: state.date,
          start: state.start,
          end: state.end,
          slotLabel: picked?.slot.label,
          zoneName: picked?.zone.name,
          plate: normalizePlate(state.plate),
          vehicleType: vehicleTypeLabel,
          slotStatus: slotState?.status,
          slotBusy: slotState?.busy,
        },
        busy: state.submitting,
        onConfirm: submit,
      })
    ));
  }

  async function refreshAvailability() {
    const ticket = ++availabilityRequest;
    if (!state.date || !state.start || !state.end) return;
    lotAlert.replaceChildren();
    try {
      const availability = await getAvailability({ date: state.date, start: state.start, end: state.end });
      if (ticket !== availabilityRequest) return;
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

  async function submit() {
    if (state.submitting || !state.selectedSlotId) return;
    submitAlert.replaceChildren();
    state.plateError = plateErrorFor(state.plate);
    if (state.plateError) {
      renderSummary();
      document.getElementById('booking-plate')?.focus();
      return;
    }
    state.plate = normalizePlate(state.plate);
    state.submitting = true;
    renderSummary();
    try {
      const result = await createReservation({
        user_name: state.userName,
        slot_id: state.selectedSlotId,
        date: state.date,
        start: state.start,
        end: state.end,
        plate: state.plate,
        vehicle_type: state.vehicleType,
      });
      window.location.hash = `#/ticket/${encodeURIComponent(result.reservation.code)}`;
    } catch (error) {
      if (error?.code === 'INVALID_PLATE') state.plateError = messageFor(error);
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
    .then((layout) => {
      state.layout = layout;
      renderTime();
      renderLot();
      refreshAvailability();
    })
    .catch((error) => lotBox.replaceChildren(Alert({ tone: 'error', message: messageFor(error) })));

  return PageShell({
    title: 'จองที่จอดรถ',
    subtitle: 'เลือกวัน เวลา ช่องจอด และระบุข้อมูลเพื่อสำรองช่องจอด',
    children: h('div', stack,
      Card({ title: '1. กำหนดวัน เวลา และประเภทรถ', children: timeBox }),
      Card({ title: '2. เลือกช่องจอดบนผัง', children: [lotAlert, lotBox] }),
      Card({ title: '3. ตรวจสอบข้อมูลและยืนยันการจอง', children: [summaryBox, submitAlert] })
    ),
  });
}
