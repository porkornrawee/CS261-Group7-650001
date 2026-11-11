import test from 'node:test';
import assert from 'node:assert/strict';

// window/sessionStorage จำลองสำหรับโหมด ?mock=1
const storage = new Map();
globalThis.window = {
  location: { search: '?mock=1', hash: '#/' },
  sessionStorage: {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
  },
};
globalThis.fetch = async () => ({
  json: async () => ({ ok: true, accounts: [{ student_id: '6509650001', password: 'test1234', name: 'ทดสอบ ระบบจอด' }] }),
});

const { login, logout, me } = await import('../js/api/auth.js');
const { safeNext, loginRedirect, nextFromHash } = await import('../js/features/auth/session.js');
const { graceText } = await import('../js/features/reservation/GraceNotice.js');

test('TC-US11-01 ล็อกอินสำเร็จแล้ว /me คืนผู้ใช้', async () => {
  const res = await login({ studentId: '6509650001', password: 'test1234' });
  assert.equal(res.user.student_id, '6509650001');
  const current = await me();
  assert.equal(current.user.student_id, '6509650001');
});

test('TC-US11-02 รหัสผ่านผิดได้ INVALID_CREDENTIALS และไม่บอกว่าผิดช่องไหน', async () => {
  await assert.rejects(login({ studentId: '6509650001', password: 'wrong' }), (err) => err.code === 'INVALID_CREDENTIALS' && err.status === 401);
  await assert.rejects(login({ studentId: '0000000000', password: 'test1234' }), (err) => err.code === 'INVALID_CREDENTIALS');
});

test('TC-US11-03 ออกจากระบบแล้ว /me ได้ 401 และ guard เด้งไปหน้า login', async () => {
  await logout();
  await assert.rejects(me(), (err) => err.code === 'UNAUTHORIZED' && err.status === 401);
  assert.equal(loginRedirect('/booking'), '#/login?next=%2Fbooking');
  assert.equal(loginRedirect('/'), '#/login');
});

test('next หลังล็อกอินรับเฉพาะ path ภายในแอป', () => {
  assert.equal(safeNext('/history'), '/history');
  assert.equal(safeNext('//evil.example'), '/');
  assert.equal(safeNext('https://evil.example'), '/');
  assert.equal(safeNext('/login'), '/');
  assert.equal(nextFromHash('#/login?next=%2Fticket%2FPK-1'), '/ticket/PK-1');
});
test('US12 ข้อความ grace period บอกจำนวนนาทีและเวลาสุดท้าย', () => {
  assert.match(graceText(15, '08:00'), /15 นาที/);
  assert.match(graceText(15, '08:00'), /08:15/);
  assert.match(graceText(undefined, ''), /15 นาที/);
});