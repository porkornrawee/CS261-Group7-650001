import test from 'node:test';
import assert from 'node:assert/strict';
import { ERROR_MESSAGES, messageFor } from '../js/api/errors.js';

test('messageFor แปลงรหัส error ที่รู้จักเป็นข้อความไทย', () => {
  assert.equal(messageFor({ code: 'SLOT_CONFLICT' }), ERROR_MESSAGES.SLOT_CONFLICT);
  assert.equal(messageFor({ code: 'TU_NOT_FOUND' }), ERROR_MESSAGES.TU_NOT_FOUND);
});

test('messageFor ใช้ข้อความจาก backend เมื่อไม่รู้จักรหัส', () => {
  assert.equal(messageFor({ code: 'WHATEVER', message: 'ข้อความจากเซิร์ฟเวอร์' }), 'ข้อความจากเซิร์ฟเวอร์');
});

test('messageFor มีข้อความสำรองเมื่อไม่มีทั้งรหัสและข้อความ', () => {
  assert.equal(messageFor({ code: 'X' }), 'เกิดข้อผิดพลาด กรุณาลองใหม่');
});

test('messageFor ตรวจจับ network error', () => {
  assert.equal(messageFor(new TypeError('Failed to fetch')), ERROR_MESSAGES.NETWORK_ERROR);
  assert.equal(messageFor({ code: 'NETWORK_ERROR' }), ERROR_MESSAGES.NETWORK_ERROR);
  assert.equal(messageFor(undefined), ERROR_MESSAGES.NETWORK_ERROR);
});
