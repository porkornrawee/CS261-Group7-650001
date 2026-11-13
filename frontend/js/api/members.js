/**
 * api/members.js — สมัครสมาชิก (Owner: Dev 2 | Ticket: US2)
 *
 * POST /api/members
 *   body { student_id, name, phone, email, password, vehicle_type: 'car'|'motorcycle', plate, province }
 *   -> 201 { ok:true, member:{student_id,name,email,phone}, vehicle:{...} }  (backend ล็อกอินให้อัตโนมัติ)
 *   -> 400 VALIDATION_ERROR | 404 STUDENT_NOT_FOUND | 409 MEMBER_DUPLICATE
 * mock: รหัสนักศึกษาที่ลงท้าย 0000 = ซ้ำ (member-duplicate.json) นอกนั้นสำเร็จ (member-registered.json)
 */
import { request } from './client.js';

export function registerMember(payload) {
  const studentId = String(payload.student_id ?? '').trim();
  const mockFile = studentId.endsWith('0000') ? 'member-duplicate.json' : 'member-registered.json';
  return request('/api/members', {
    method: 'POST',
    body: {
      student_id: studentId,
      name: payload.name,
      phone: payload.phone,
      email: payload.email,
      password: payload.password,
      vehicle_type: payload.vehicle_type,
      plate: payload.plate,
      province: payload.province,
    },
    mockFile,
  });
}
