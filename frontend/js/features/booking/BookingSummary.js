/**
 * BookingSummary — สรุปก่อนยืนยัน (วัน เวลา ช่อง ทะเบียนรถ ค่าบริการ) + ปุ่มยืนยัน
 */
import { h } from '../../core/dom.js';
import { thaiDate, toMin, durationText } from '../../core/time.js';
import { Button } from '../../components/ui/Button.js';
import { GraceNotice } from '../reservation/GraceNotice.js';

function pickNote({ slotLabel, slotStatus, slotBusy = [] }) {
  if (!slotLabel) return { tone: 'none', text: 'ยังไม่ได้เลือกช่องจอด กรุณาแตะเลือกช่องที่ต้องการในผัง' };
  const busyText = slotBusy.map((b) => `${b.start}–${b.end}`).join(', ');
  if (slotStatus === 'free') return { tone: 'ok', text: 'ช่องว่างตลอดช่วงเวลาที่เลือก พร้อมทำการจอง' };
  if (slotStatus === 'partial') return { tone: 'warn', text: `ติดจองช่วง ${busyText} น. ลองปรับเปลี่ยนเวลา` };
  if (slotStatus === 'booked') return { tone: 'bad', text: 'ไม่ว่างในช่วงเวลานี้ ระบบจะไม่รับการจอง' };
  return null;
}

export function BookingSummary({ summary = {}, busy = false, onConfirm = () => {} } = {}) {
  const { date, start, end, slotLabel, zoneName, plate, vehicleType = 'รถยนต์', graceMin = 15 } = summary;
  const ready = Boolean(date && start && end && slotLabel);
  const minutes = start && end ? toMin(end) - toMin(start) : 0;

  const row = (label, value) => h('div', { class: 'booking-summary__row' },
    h('dt', { class: 'booking-summary__label' }, label),
    h('dd', { class: 'booking-summary__value' }, value || '–')
  );

  const note = pickNote(summary);

  return h('section', { class: 'booking-summary', 'aria-label': 'สรุปการจอง' },
    h('h3', { style: 'margin:0 0 var(--space-2);font-size:1.15rem;color:var(--primary)' }, 'สรุปรายละเอียดการจอง'),
    h('dl', { class: 'booking-summary__list' },
      row('สถานที่ / โซน', zoneName || 'ที่จอดอาคาร SC 1'),
      row('ช่องจอดที่เลือก', slotLabel),
      row('ประเภทรถ', vehicleType),
      row('วันที่จอง', date ? thaiDate(date) : ''),
      row('ช่วงเวลา', start && end ? `${start} – ${end} น.${minutes > 0 ? ` (${durationText(minutes)})` : ''}` : ''),
      row('ทะเบียนรถ', plate),
      row('ค่าบริการ', 'ฟรี (สิทธิ์นักศึกษา/บุคลากร)')
    ),
        note ? h('p', { class: `booking-summary__note booking-summary__note--${note.tone}`, role: 'status' }, note.text) : null,
    GraceNotice({ graceMin, start }),
    h('div', { class: 'booking-summary__action' },
      Button({ label: 'ยืนยันการจอง', disabled: !ready, loading: busy, onClick: () => onConfirm() })
    )
  );
}
