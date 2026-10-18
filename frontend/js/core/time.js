/**
 * core/time.js — ตัวช่วยวันที่/เวลา (Owner: Dev 1 | Ticket: CO-02)
 * ให้ย้ายฟังก์ชันเหล่านี้จาก backend-python/static/index.html บรรทัด ~402-416 มาเขียนเป็น ES module:
 *   pad(n), ymd(date) -> 'YYYY-MM-DD', toMin('HH:MM') -> number, fromMin(number) -> 'HH:MM',
 *   durationText(minutes) -> '1 ชม. 30 นาที', thaiDate('YYYY-MM-DD') -> 'พฤ. 17 ต.ค.'
 * Dev 3 (BookingPage) พึ่งไฟล์นี้ — ส่งให้เร็ว
 */
export const pad = (n) => String(n).padStart(2, '0');
export function ymd(date) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function toMin(hhmm) {
  const [hours, minutes] = String(hhmm).split(':').map(Number);
  return hours * 60 + minutes;
}
export function fromMin(minutes) {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}
export function durationText(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? `${h} ชม.` : '', m ? `${m} นาที` : ''].filter(Boolean).join(' ') || '0 นาที';
}
export function thaiDate(text) {
  const [y, m, d] = text.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const month = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  return `${date.getDate()} ${month[date.getMonth()]} ${date.getFullYear() + 543}`;
}
