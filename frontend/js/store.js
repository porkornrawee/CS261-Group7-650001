/**
 * store.js — state กลางแบบ pub/sub เล็ก ๆ (Owner: Dev 1 | Ticket: CO-04, US11)
 *
 * ใส่เฉพาะข้อมูลที่ "หลายหน้าใช้ร่วมกัน" เท่านั้น:
 *   user     : { student_id, name } | null            (ผู้ที่ล็อกอินอยู่ ได้จาก /api/auth/login หรือ /api/auth/me)
 *   authChecked : boolean                             (เช็ก /api/auth/me แล้วหรือยัง ใช้ใน route guard)
 *   student  : { student_id, name, faculty } | null   (หลังยืนยันกับ TU ผ่านที่ VehiclePage)
 *   vehicle  : { id, plate, province } | null         (หน้าจองจะดึงทะเบียนไปแสดงสรุป)
 *   ห้ามเก็บ state ภายในของ component/หน้าเดียว (ให้ component จัดการเอง)
 *
 * API: getState(), setState(patch), subscribe(listener) -> unsubscribe, isLoggedIn()
 */
const state = { user: null, authChecked: false, student: null, vehicle: null };
const listeners = new Set();

export function getState() { return state; }

export function setState(patch) {
  Object.assign(state, patch);
  listeners.forEach((fn) => fn(state));
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isLoggedIn() {
  return Boolean(state.user);
}