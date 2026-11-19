import test from 'node:test';
import assert from 'node:assert/strict';

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
};
const { saveLocalReservation, updateLocalStatus, mergeWithLocal } = await import('../js/core/localHistory.js');

const r = (code, date, status = 'active') => ({ code, slot: 'A1', zone: 'โซน A', date, start: '09:00', end: '10:00', status });
const NOW = new Date('2026-11-19T12:00:00');

test('การจองที่เลยเวลาแล้วขึ้นเป็นเสร็จสิ้น ส่วนที่ยังไม่ถึงเวลาไม่ขึ้นในประวัติ', () => {
  store.clear();
  saveLocalReservation('u1', r('PK-OLD', '2026-11-10'));
  saveLocalReservation('u1', r('PK-FUTURE', '2026-12-01'));
  const out = mergeWithLocal('u1', [], '', NOW);
  assert.deepEqual(out.map((x) => [x.code, x.status]), [['PK-OLD', 'completed']]);
});

test('server ชนะเมื่อ code ซ้ำ และกรองตามสถานะได้', () => {
  store.clear();
  saveLocalReservation('u1', r('PK-A', '2026-11-10'));
  updateLocalStatus('u1', 'PK-A', 'cancelled');
  assert.equal(mergeWithLocal('u1', [r('PK-A', '2026-11-10', 'completed')], '', NOW).length, 1);
  assert.equal(mergeWithLocal('u1', [], 'completed', NOW).length, 0);
  assert.equal(mergeWithLocal('u1', [], 'cancelled', NOW)[0].code, 'PK-A');
});

test('แยกตามผู้ใช้ และไม่พังเมื่อไม่มี student id', () => {
  store.clear();
  saveLocalReservation('u1', r('PK-X', '2026-11-10'));
  assert.deepEqual(mergeWithLocal('u2', [], '', NOW), []);
  assert.deepEqual(mergeWithLocal(null, [{ code: 'S' }], '', NOW), [{ code: 'S' }]);
});
