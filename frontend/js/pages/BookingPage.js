/**
 * BookingPage — หน้าจอง: เลือกวัน-เวลา (พร้อม toggle เช้า/บ่าย) → เลือกประเภทรถ → เลือกช่อง → กรอกทะเบียน → ยืนยัน
 * ข้อมูลทั้งหมดมาจาก API จริง (GET /api/zones, /api/availability, POST /api/reservations)
 */
import { h } from '../core/dom.js';
import { ymd, toMin, fromMin, isPastStart, firstBookableStart } from '../core/time.js';
import { PageShell } from '../components/layout/PageShell.js';
import { Card } from '../components/ui/Card.js';
import { Field } from '../components/ui/Field.js';
import { Alert } from '../components/ui/Alert.js';
import { Spinner } from '../components/ui/Spinner.js';
import { Icon } from '../components/ui/Icon.js';
import { DateStrip } from '../features/booking/DateStrip.js';
import { TimeChips } from '../features/booking/TimeChips.js';
import { DurationPicker } from '../features/booking/DurationPicker.js';
import { ParkingLot } from '../features/booking/ParkingLot.js';
import { BookingSummary } from '../features/booking/BookingSummary.js';
import { getLayout, getAvailability } from '../api/zones.js';
import { createReservation } from '../api/reservations.js';
import { messageFor } from '../api/errors.js';
import { getState } from '../store.js';
import { normalizePlate, plateErrorFor } from '../core/plate.js';

export function BookingPage() {
  const { student, vehicle } = getState();
  const state = {
    date: ymd(new Date()),
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
  let clockTimer;

  // ผูกกับเวลาจริง: วันนี้เป็นค่าเริ่มต้น, เวลาเริ่มที่ผ่านไปแล้วเลือกไม่ได้ และเลื่อนไปช่วงเวลาถัดไปที่จองได้
  const periodRange = (period) => (period === 'morning'
    ? [toMin(state.layout?.open_time || '08:00'), toMin('12:00')]
    : [toMin('12:00'), toMin(state.layout?.close_time || '20:00')]);

  /** @returns {boolean} true ถ้าค่าวัน/ช่วง/เวลาเริ่มถูกปรับ */
  function ensureStartNotPast(now = new Date()) {
    if (!isPastStart(state.date, state.start, now)) return false;
    const close = toMin(state.layout?.close_time || '20:00');
    for (const period of [state.period, state.period === 'morning' ? 'afternoon' : 'morning']) {
      const [open, end] = periodRange(period);
      const next = firstBookableStart(state.date, open, end, 60, now);
      if (next) {
        state.period = period;
        state.start = next;
        state.end = fromMin(Math.min(toMin(next) + state.duration, close));
        return true;
      }
    }
    // วันนี้ไม่มีเวลาเหลือแล้ว → ไปพรุ่งนี้
    const nextDay = new Date(now);
    nextDay.setDate(nextDay.getDate() + 1);
    state.date = ymd(nextDay);
    state.period = 'morning';
    state.start = fromMin(periodRange('morning')[0]);
    state.end = fromMin(Math.min(toMin(state.start) + state.duration, close));
    return true;
  }
  ensureStartNotPast();

  const timeBox = h('div', { class: 'booking-page-time' });
  const lotBox = h('div', { class: 'booking-page-lot' }, Spinner({ label: 'กำลังโหลดผังลานจอด' }));
  const lotAlert = h('div', { 'aria-live': 'polite' });
  const summaryBox = h('div');
  const submitAlert = h('div', { 'aria-live': 'polite' });
  const stack = { style: 'display:grid;gap:var(--space-4)' };

  const VEHICLE_TYPES = [
    { id: 'car', icon: 'car', label: 'รถยนต์' },
    { id: 'motorcycle', icon: 'motorcycle', label: 'มอเตอร์ไซค์' },
    { id: 'ev', icon: 'bolt', label: 'รถไฟฟ้า EV' },
  ];

  // ทะเบียนตรวจฝั่งหน้าเว็บก่อนส่ง (core/plate.js); ถ้า backend ตอบ INVALID_PLATE ก็แสดงใต้ช่องเดียวกัน

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
        class: `chip-root chip-root--icon${state.period === 'morning' ? ' chip-root--selected' : ''}`,
        onClick: () => {
          if (state.period !== 'morning') {
            state.period = 'morning';
            state.start = '09:00';
            state.end = fromMin(Math.min(toMin(state.start) + state.duration, toMin('12:00')));
            ensureStartNotPast();
            renderTime();
            onTimeChange();
          }
        }
      }, Icon('sun', { size: 18 }), 'ช่วงเช้า (08:00 - 12:00)'),
      h('button', {
        type: 'button',
        class: `chip-root chip-root--icon${state.period === 'afternoon' ? ' chip-root--selected' : ''}`,
        onClick: () => {
          if (state.period !== 'afternoon') {
            state.period = 'afternoon';
            state.start = '13:00';
            state.end = fromMin(Math.min(toMin(state.start) + state.duration, toMin(state.layout?.close_time || defaultClose)));
            ensureStartNotPast();
            renderTime();
            onTimeChange();
          }
        }
      }, Icon('cloud-sun', { size: 18 }), 'ช่วงบ่าย (12:00 - 20:00)')
    );

    // Vehicle Type Segmented Control
    const vehicleTypeControl = h('div', { style: 'display:grid;gap:var(--space-2);margin-top:var(--space-2)' },
      h('label', { style: 'font-weight:700;font-size:0.95rem;color:var(--ink)' }, 'ประเภทพาหนะ'),
      h('div', { style: 'display:flex;flex-wrap:wrap;gap:var(--space-2)' },
        VEHICLE_TYPES.map((t) => h('button', {
          type: 'button',
          class: `chip-root chip-root--icon${state.vehicleType === t.id ? ' chip-root--selected' : ''}`,
          onClick: () => {
            state.vehicleType = t.id;
            renderTime();
            renderSummary();
          }
        }, Icon(t.icon, { size: 18 }), t.label))
      )
    );

    timeBox.replaceChildren(h('div', stack,
      DateStrip({ value: state.date, onChange: (date) => { state.date = date; ensureStartNotPast(); renderTime(); onTimeChange(); } }),
      periodToggle,
      TimeChips({
        value: state.start,
        date: state.date,
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
    // ผังถูกวาดใหม่ทั้งหมด → จำช่องที่โฟกัสอยู่ไว้ แล้วคืนโฟกัสให้ (ผู้ใช้คีย์บอร์ดไม่หลงตำแหน่ง, UI test M-15)
    const active = document.activeElement;
    const focusedSlot = active && lotBox.contains(active) ? active.getAttribute('data-slot') : null;
    lotBox.replaceChildren(ParkingLot({
      zones: state.layout.zones,
      availability: state.availability,
      selectedSlotId: state.selectedSlotId,
      onSelectSlot: (id) => { state.selectedSlotId = id; renderLot(); renderSummary(); },
    }));
    if (focusedSlot) lotBox.querySelector(`[data-slot="${focusedSlot}"]`)?.focus();
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
          graceMin: state.layout?.grace_min,
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
    if (isPastStart(state.date, state.start)) {
      ensureStartNotPast();
      renderTime();
      onTimeChange();
      submitAlert.replaceChildren(Alert({ tone: 'error', message: 'เวลาที่เลือกผ่านไปแล้ว ระบบปรับเป็นเวลาถัดไปที่จองได้ให้แล้ว กรุณาตรวจสอบก่อนยืนยัน' }));
      return;
    }
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
      ensureStartNotPast();
      renderTime();
      renderLot();
      refreshAvailability();
    })
    .catch((error) => lotBox.replaceChildren(Alert({ tone: 'error', message: messageFor(error) })));

  // เดินตามเวลาจริง: ทุกนาทีปิดชิปเวลาที่ผ่านไปแล้ว (หยุดเองเมื่อออกจากหน้านี้)
  clockTimer = setInterval(() => {
    if (!timeBox.isConnected) { clearInterval(clockTimer); return; }
    const moved = ensureStartNotPast();
    renderTime();
    if (moved) onTimeChange();
  }, 60000);

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
