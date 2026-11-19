/**
 * core/localHistory.js — สำเนาประวัติการจองเก็บในเบราว์เซอร์ (localStorage) แยกตามผู้ใช้
 * ใช้เสริมเมื่อ backend เก็บข้อมูลไม่ถาวร (เช่น เดโมบน Vercel ที่ SQLite อยู่ใน /tmp) ประวัติจะไม่หายจากเครื่องนี้
 * localStorage อาจใช้ไม่ได้ (โหมดส่วนตัว/ปิดไว้) จึงครอบ try/catch ทุกจุด และหน้าเว็บต้องทำงานได้ปกติถ้าไม่มี
 */
const PREFIX = 'parking.history.';
const MAX_ITEMS = 100;
const FINAL = new Set(['completed', 'cancelled', 'auto_cancelled']);

function read(key) {
  try {
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(list) ? list : [];
  } catch { return []; }
}

function write(key, list) {
  try { localStorage.setItem(key, JSON.stringify(list.slice(0, MAX_ITEMS))); } catch { /* เก็บไม่ได้ก็ข้าม */ }
}

const keyOf = (studentId) => (studentId ? PREFIX + studentId : null);

/** บันทึก/อัปเดตการจอง 1 รายการ (อิงตาม code) */
export function saveLocalReservation(studentId, reservation) {
  const key = keyOf(studentId);
  if (!key || !reservation?.code) return;
  const list = read(key).filter((r) => r.code !== reservation.code);
  list.unshift({ ...reservation });
  write(key, list);
}

/** เปลี่ยนสถานะของรายการที่เก็บไว้ (เช่น ยกเลิกแล้ว) */
export function updateLocalStatus(studentId, code, status) {
  const key = keyOf(studentId);
  if (!key) return;
  write(key, read(key).map((r) => (r.code === code ? { ...r, status } : r)));
}

/** สถานะที่แสดงในประวัติ: การจองที่เลยเวลาสิ้นสุดแล้วและไม่ถูกยกเลิก = เสร็จสิ้น */
function effectiveStatus(r, now) {
  if (FINAL.has(r.status)) return r.status;
  const end = new Date(`${r.date}T${r.end}:00`);
  return Number.isNaN(end.getTime()) || end > now ? r.status : 'completed';
}

/** รวมรายการจาก server กับที่เก็บในเครื่อง (server ชนะเมื่อ code ซ้ำ) เฉพาะรายการที่จบแล้ว ตรงกับหน้าประวัติ */
export function mergeWithLocal(studentId, serverList, status = '', now = new Date()) {
  const key = keyOf(studentId);
  if (!key) return serverList;
  const known = new Set(serverList.map((r) => r.code));
  const extras = read(key)
    .filter((r) => !known.has(r.code))
    .map((r) => ({ ...r, status: effectiveStatus(r, now) }))
    .filter((r) => FINAL.has(r.status) && (!status || r.status === status));
  if (!extras.length) return serverList;
  const when = (r) => `${r.date || ''}T${r.start || ''}`;
  return [...serverList, ...extras].sort((a, b) => (when(a) < when(b) ? 1 : -1));
}
