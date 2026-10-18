/**
 * api/vehicles.js — ลงทะเบียนรถ (Owner: Dev 2 | Ticket: VH-04)
 *
 * ⚠ endpoint กลุ่มนี้ "ยังไม่มีใน backend Flask" เป็นสัญญาที่ PM เสนอตาม sequence diagram
 *   ทำงานด้วย mock ก่อน ทีม backend (Spring Boot) จะ implement ตามสัญญานี้ทีหลัง
 *   ถ้า Dev 2 จะเปลี่ยนรูปแบบ ต้องแจ้ง PM ก่อน
 *
 * หมายเหตุสถาปัตยกรรม: เบราว์เซอร์ห้ามเรียก TU REST API ตรง (Application-Key จะหลุด)
 *   ให้เรียก /api/vehicles/verify แล้ว backend เป็นคนเรียก TU
 */
import { request } from './client.js';

/**
 * POST /api/vehicles/verify  { student_id, email }
 * -> ok:  { ok:true, student:{student_id,name,faculty,email} }
 * -> fail: { ok:false, error:{code:'TU_NOT_FOUND'|'TU_UNAVAILABLE', message} }
 * mock ผ่าน: vehicle-verify-ok.json | mock ไม่ผ่าน: เปลี่ยน mockFile เป็น vehicle-verify-fail.json
 */
export function verifyStudent({ student_id, email }) {
  const studentId = String(student_id ?? '').trim();
  const mockFile = studentId.endsWith('0000')
    ? 'vehicle-verify-fail.json'
    : 'vehicle-verify-ok.json';
  return request('/api/vehicles/verify', {
    method: 'POST',
    body: {
      student_id: studentId,
      email
    },
    mockFile
  });
}
/**
 * POST /api/vehicles  { student_id, plate, province }
 * -> { ok:true, vehicle:{id,student_id,plate,province} }   (mock: vehicle-saved.json)
 */
export function saveVehicle({ student_id, plate, province }) {
  return request('/api/vehicles', { method: 'POST', body: { student_id, plate, province }, mockFile: 'vehicle-saved.json' });
}
