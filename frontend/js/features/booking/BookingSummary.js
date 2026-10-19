/**
 * BookingSummary — สรุปก่อนยืนยัน (วัน เวลา ช่อง ทะเบียนรถ) + ปุ่มยืนยัน
 * Owner: Dev 3 | Ticket: BK-07 | Priority: P0
 * @param { {summary:{date:string,start:string,end:string,slotLabel?:string,zoneName?:string,plate?:string,slotStatus?:'free'|'partial'|'booked',slotBusy?:Array<{start:string,end:string}>}, busy?:boolean, onConfirm:()=>void} } props
 *   slotStatus/slotBusy (ไม่บังคับ) ใช้แสดงคำเตือนของช่องที่เลือก ตาม updatePick() เดิม
 * @returns {HTMLElement}
 * Done when: ปุ่มยืนยันปิดจนกว่าจะเลือกช่องครบ
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .booking-summary- ใน BookingSummary.css)
 */
import { h } from '../../core/dom.js';
import { thaiDate, toMin, durationText } from '../../core/time.js';
import { Button } from '../../components/ui/Button.js';

// ข้อความใต้สรุปตามสถานะช่องที่เลือก (โค้ดเก่า parking-lot.js บรรทัด 86-103 updatePick)
function pickNote({ slotLabel, slotStatus, slotBusy = [] }) {
  if (!slotLabel) return { tone: 'none', text: 'ยังไม่ได้เลือกช่องจอด แตะช่องที่ต้องการในผังด้านบน' };
  const busyText = slotBusy.map((b) => `${b.start}–${b.end}`).join(', ');
  if (slotStatus === 'free') return { tone: 'ok', text: 'ว่างตลอดช่วงเวลาที่เลือก' };
  if (slotStatus === 'partial') return { tone: 'warn', text: `ติดจอง ${busyText} น. ลองเลื่อนเวลาให้พ้นช่วงนี้` };
  if (slotStatus === 'booked') return { tone: 'bad', text: 'ไม่ว่างในช่วงเวลานี้ ระบบจะไม่รับการจอง' };
  return null;
}

export function BookingSummary({ summary = {}, busy = false, onConfirm = () => {} } = {}) {
  const { date, start, end, slotLabel, zoneName, plate } = summary;
  const ready = Boolean(date && start && end && slotLabel);
  const minutes = start && end ? toMin(end) - toMin(start) : 0;

  const row = (label, value) => h('div', { class: 'booking-summary__row' },
    h('dt', { class: 'booking-summary__label' }, label),
    h('dd', { class: 'booking-summary__value' }, value || '–'));

  const note = pickNote(summary);

  return h('section', { class: 'booking-summary', 'aria-label': 'สรุปการจอง' },
    h('dl', { class: 'booking-summary__list' },
      row('วันที่', date ? thaiDate(date) : ''),
      row('เวลา', start && end ? `${start}–${end} น.${minutes > 0 ? ` (${durationText(minutes)})` : ''}` : ''),
      row('ช่องจอด', slotLabel ? `${slotLabel}${zoneName ? ` · ${zoneName}` : ''}` : ''),
      row('ทะเบียนรถ', plate)),
    note ? h('p', { class: `booking-summary__note booking-summary__note--${note.tone}`, role: 'status' }, note.text) : null,
    // ปิดปุ่มจนกว่าจะเลือกช่องครบ; busy = กำลังส่งจอง (กันกดซ้ำ)
    h('div', { class: 'booking-summary__action' },
      Button({ label: 'ยืนยันการจอง', disabled: !ready, loading: busy, onClick: () => onConfirm() })),
  );
}
