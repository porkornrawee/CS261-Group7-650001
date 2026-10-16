/**
 * core/time.js — ตัวช่วยวันที่/เวลา (Owner: Dev 1 | Ticket: CO-02)
 * ให้ย้ายฟังก์ชันเหล่านี้จาก backend-python/static/index.html บรรทัด ~402-416 มาเขียนเป็น ES module:
 *   pad(n), ymd(date) -> 'YYYY-MM-DD', toMin('HH:MM') -> number, fromMin(number) -> 'HH:MM',
 *   durationText(minutes) -> '1 ชม. 30 นาที', thaiDate('YYYY-MM-DD') -> 'พฤ. 17 ต.ค.'
 * Dev 3 (BookingPage) พึ่งไฟล์นี้ — ส่งให้เร็ว
 */
export function pad(n) { return String(n).padStart(2, '0'); }

// TODO(Dev 1): ymd, toMin, fromMin, durationText, thaiDate
export function ymd(_date) { throw new Error('TODO(Dev 1): CO-02'); }
export function toMin(_hhmm) { throw new Error('TODO(Dev 1): CO-02'); }
export function fromMin(_minutes) { throw new Error('TODO(Dev 1): CO-02'); }
export function durationText(_minutes) { throw new Error('TODO(Dev 1): CO-02'); }
export function thaiDate(_ymdText) { throw new Error('TODO(Dev 1): CO-02'); }
