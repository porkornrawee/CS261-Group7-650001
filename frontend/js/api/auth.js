/**
 * api/auth.js — เข้าสู่ระบบ / ออกจากระบบ / ผู้ใช้ปัจจุบัน (Owner: Dev 1 | Ticket: US11)
 *
 * สัญญา API (backend-python/auth_service.py):
 *   POST /api/auth/login  body { student_id, password }
 *        -> 200 { ok:true, user:{ student_id, name } }
 *        -> 401 { ok:false, error:{ code:'INVALID_CREDENTIALS' } }   (ข้อความเดียวกัน ไม่บอกว่าผิดช่องไหน)
 *   POST /api/auth/logout -> 200 { ok:true }
 *   GET  /api/auth/me     -> 200 { ok:true, user:{...} } | 401 { code:'UNAUTHORIZED' }
 *
 * โหมด ?mock=1: ใช้บัญชีทดสอบใน mock/auth.json และจำสถานะล็อกอินไว้ใน sessionStorage
 * เพื่อให้ทดสอบ route guard (TC-US11-03) ได้โดยไม่ต้องรัน backend
 */
import { request, isMock, ApiError } from './client.js';

const MOCK_SESSION_KEY = 'parking-mock-user';

function readMockSession() {
  try {
    const raw = window.sessionStorage.getItem(MOCK_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeMockSession(user) {
  try {
    if (user) window.sessionStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(user));
    else window.sessionStorage.removeItem(MOCK_SESSION_KEY);
  } catch {
    // sessionStorage ใช้ไม่ได้ (private mode) — mock จะลืมสถานะเมื่อรีเฟรช ซึ่งรับได้
  }
}

/** @returns {Promise<{ok:true, user:{student_id:string, name:string}}>} */
export async function login({ studentId, password }) {
  const body = { student_id: String(studentId || '').trim(), password: String(password || '') };
  if (isMock()) {
    const data = await request('/api/auth/login', { mockFile: 'auth.json' });
    const account = data.accounts.find((a) => a.student_id === body.student_id && a.password === body.password);
    if (!account) throw new ApiError('INVALID_CREDENTIALS', 'รหัสนักศึกษาหรือรหัสผ่านไม่ถูกต้อง', 401);
    const user = { student_id: account.student_id, name: account.name };
    writeMockSession(user);
    return { ok: true, user };
  }
  return request('/api/auth/login', { method: 'POST', body });
}

export async function logout() {
  if (isMock()) {
    writeMockSession(null);
    return { ok: true };
  }
  return request('/api/auth/logout', { method: 'POST' });
}

/** คืน user ที่ล็อกอินอยู่ หรือ throw ApiError(UNAUTHORIZED, 401) */
export async function me() {
  if (isMock()) {
    const user = readMockSession();
    if (!user) throw new ApiError('UNAUTHORIZED', 'กรุณาเข้าสู่ระบบก่อนใช้งาน', 401);
    return { ok: true, user };
  }
  return request('/api/auth/me');
}