/**
 * store.js — state กลางแบบ pub/sub เล็ก ๆ (Owner: Dev 1 | Ticket: CO-04)
 *
 * ใส่เฉพาะข้อมูลที่ "หลายหน้าใช้ร่วมกัน" เท่านั้น:
 *   student  : { student_id, name, faculty } | null   (หลังยืนยันกับ TU ผ่านที่ VehiclePage)
 *   vehicle  : { id, plate, province } | null         (หน้าจองจะดึงทะเบียนไปแสดงสรุป)
 *   ห้ามเก็บ state ภายในของ component/หน้าเดียว (ให้ component จัดการเอง)
 *
 * API: getState(), setState(patch), subscribe(listener) -> unsubscribe
 */
const state = { student: null, vehicle: null };
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
