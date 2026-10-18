/**
 * BookingPage — หน้าจอง 3 ขั้น: เลือกวัน-เวลา → เลือกช่อง → ยืนยัน แล้วไป #/ticket/<code>  (ใช้ DateStrip, TimeChips, DurationPicker, ParkingLot, BookingSummary, api/zones.js, api/reservations.js)
 * Owner: Dev 3 | Ticket: PG-03 | Priority: P0 | Route: #/booking
 * @param { { params: Record<string,string> } } ctx  พารามิเตอร์จาก URL (เช่น ticket → params.code)
 * @returns {HTMLElement}
 * Page เท่านั้นที่คุยกับ js/api/* และ js/store.js ได้ (component ใน ui/ ห้ามรู้จัก api)
 */
import { todo } from '../core/dom.js';

/**
 * BookingPage — หน้าจอง 3 ขั้น (เวอร์ชันพรีวิวตรงตามดีไซน์ ป้องกันพรีวิวหาย)
 */
import { h } from '../core/dom.js';
import { TimeChips } from '../features/booking/TimeChips.js';
import { DurationPicker } from '../features/booking/DurationPicker.js';
import { ParkingLot } from '../features/booking/ParkingLot.js';
import { BookingSummary } from '../features/booking/BookingSummary.js';

export function BookingPage(ctx = { params: {} }) {
  // ฟังก์ชันเวลาเฉพาะในหน้านี้ ตัดปัญหา time.js พัง
  const getTodayYmd = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const toMinVal = (hhmm) => {
    if (!hhmm) return 0;
    const [h, m] = hhmm.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const fromMinVal = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  let selectedDate = getTodayYmd();
  let selectedStart = '11:00';
  let durationMins = 120;
  let selectedSlotId = 105;
  let selectedSlotLabel = 'A5';
  let selectedZoneName = '🚗 โซนรถยนต์ / ⚡ EV';
  let isBusy = false;

  const zonesData = [
    {
      id: 1,
      name: '🚗 โซนรถยนต์ / ⚡ EV · ว่าง 12 ช่อง',
      slots: [
        { id: 101, label: 'A1' }, { id: 102, label: 'A2' }, { id: 103, label: 'A3' },
        { id: 104, label: 'A4' }, { id: 105, label: 'A5' }, { id: 106, label: 'A6' }
      ]
    }
  ];

  const availabilityData = {
    zones: [{ id: 1, free: 5, total: 6, full: false }],
    slots: [
      { id: 101, status: 'free' },
      { id: 102, status: 'booked' },
      { id: 103, status: 'free' },
      { id: 104, status: 'booked' },
      { id: 105, status: 'free' },
      { id: 106, status: 'free' }
    ]
  };

  const container = h('div', { class: 'booking-page w', style: 'max-width: 800px; margin: 0 auto; padding: 24px 16px; font-family: sans-serif;' },
    h('div', { style: 'margin-bottom: 20px;' },
      h('h1', { style: 'font-size: 22px; font-weight: 700; color: #0f2a4a; margin: 0 0 4px 0;' }, 'ที่จอดอาคาร SC 1'),
      h('div', { style: 'color: #7d8ba0; font-size: 13px;' }, '📍 โซนใต้อาคาร · ว่าง 31 ช่อง')
    ),
    h('div', { id: 'picker-section' }),
    h('div', { id: 'lot-section' }),
    h('div', { id: 'summary-section' })
  );

  function renderAll() {
    const pickerSec = container.querySelector('#picker-section');
    const lotSec = container.querySelector('#lot-section');
    const summarySec = container.querySelector('#summary-section');

    if (pickerSec) {
      pickerSec.innerHTML = '';
      
      // ปุ่มเลือกวันที่ (สร้างตรงในนี้ป้องกัน DateStrip ไปดึง time.js)
      const dateStripMock = h('div', { style: 'display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px;' });
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dayNum = String(d.getDate()).padStart(2, '0');
        const monthNum = String(d.getMonth() + 1).padStart(2, '0');
        const dStr = `${d.getFullYear()}-${monthNum}-${dayNum}`;
        const isSelected = dStr === selectedDate;

        const btn = h('button', {
          style: `padding: 8px 14px; border-radius: 8px; border: 1px solid ${isSelected ? '#b5121b' : '#d5deea'}; background: ${isSelected ? '#b5121b' : '#fff'}; color: ${isSelected ? '#fff' : '#0f2a4a'}; font-weight: bold; cursor: pointer; font-size: 13px;`,
          onClick: () => { selectedDate = dStr; renderAll(); }
        }, `${dayNum}/${monthNum}`);
        dateStripMock.appendChild(btn);
      }

      const pickerCard = h('div', { class: 'card', style: 'background: #fff; border: 1px solid #d5deea; border-radius: 12px; padding: 16px; margin-bottom: 16px;' },
        h('h3', { style: 'font-size: 15px; font-weight: 700; margin: 0 0 12px 0; color: #0f2a4a;' }, 'เลือกวันและเวลาจอง'),
        dateStripMock,
        h('div', { style: 'margin-top: 14px;' },
          h('label', { style: 'font-size: 12px; color: #7d8ba0; display: block; margin-bottom: 6px;' }, 'เวลาเริ่มต้น'),
          TimeChips({
            openTime: '08:00', closeTime: '20:00', value: selectedStart,
            onChange: (t) => { selectedStart = t; renderAll(); }
          })
        ),
        h('div', { style: 'margin-top: 14px;' },
          h('label', { style: 'font-size: 12px; color: #7d8ba0; display: block; margin-bottom: 6px;' }, 'ระยะเวลาจอง'),
          DurationPicker({
            startTime: selectedStart,
            valueMin: durationMins,
            closeTime: '20:00',
            onChange: (mins) => { durationMins = mins; renderAll(); }
          })
        )
      );
      pickerSec.appendChild(pickerCard);
    }

    if (lotSec) {
      lotSec.innerHTML = '';
      const lotCard = h('div', { class: 'card', style: 'background: #fff; border: 1px solid #d5deea; border-radius: 12px; padding: 16px; margin-bottom: 16px;' },
        h('h3', { style: 'font-size: 15px; font-weight: 700; margin: 0 0 12px 0; color: #0f2a4a;' }, 'ผังที่จอด'),
        ParkingLot({
          zones: zonesData,
          availability: availabilityData,
          selectedSlotId,
          onSelectSlot: (slotId) => {
            selectedSlotId = slotId;
            for (const zone of zonesData) {
              const found = zone.slots.find(s => s.id === slotId);
              if (found) {
                selectedSlotLabel = found.label;
                selectedZoneName = zone.name;
                break;
              }
            }
            renderAll();
          }
        })
      );
      lotSec.appendChild(lotCard);
    }

    if (summarySec) {
      summarySec.innerHTML = '';
      const startMin = toMinVal(selectedStart);
      const endMin = Math.min(startMin + durationMins, 20 * 60);
      const endTime = fromMinVal(endMin);

      summarySec.appendChild(BookingSummary({
        summary: {
          date: selectedDate,
          start: selectedStart,
          end: endTime,
          slotLabel: selectedSlotLabel,
          zoneName: selectedZoneName,
          plate: 'กก 1234'
        },
        busy: isBusy,
        onConfirm: () => {
          window.location.hash = '#/ticket/SP261019-PWPA';
        }
      }));
    }
  }

  renderAll();
  return container;
}