// รัน: node --test frontend/tests   (ใช้ node:test ในตัว ไม่ต้องติดตั้งอะไร)
import test from 'node:test';
import assert from 'node:assert/strict';
import { pad, ymd, toMin, fromMin, durationText, thaiDate } from '../js/core/time.js';

test('pad เติมศูนย์นำหน้าให้ครบ 2 หลัก', () => {
  assert.equal(pad(5), '05');
  assert.equal(pad(12), '12');
});

test('ymd จัดรูปแบบวันที่ท้องถิ่นเป็น YYYY-MM-DD', () => {
  assert.equal(ymd(new Date(2026, 0, 5)), '2026-01-05');
  assert.equal(ymd(new Date(2026, 9, 20, 23, 59)), '2026-10-20');
});

test('toMin / fromMin แปลงไป-กลับได้', () => {
  assert.equal(toMin('08:30'), 510);
  assert.equal(toMin('00:00'), 0);
  assert.equal(fromMin(510), '08:30');
  assert.equal(fromMin(toMin('20:00')), '20:00');
});

test('durationText แสดงชั่วโมง/นาทีเป็นภาษาไทย', () => {
  assert.equal(durationText(30), '30 นาที');
  assert.equal(durationText(60), '1 ชม.');
  assert.equal(durationText(90), '1 ชม. 30 นาที');
  assert.equal(durationText(0), '0 นาที');
});

test('thaiDate แสดงวันที่แบบ พ.ศ.', () => {
  assert.equal(thaiDate('2026-10-20'), '20 ต.ค. 2569');
  assert.equal(thaiDate('2026-01-05'), '5 ม.ค. 2569');
});
