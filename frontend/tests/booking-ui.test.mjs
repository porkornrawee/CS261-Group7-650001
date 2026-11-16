/**
 * QA (US7) — Component Test Suite ของหน้าจอง (Owner: Dev 3)
 * รหัสเคส UI-xx ตรงกับเอกสาร docs/sprint2/ui-test-cases.md
 * รัน: node --test frontend/tests/
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { BookingSummary } from '../js/features/booking/BookingSummary.js';
import { ParkingLot } from '../js/features/booking/ParkingLot.js';
import { PLATE_EMPTY_MESSAGE, PLATE_FORMAT_MESSAGE, normalizePlate, plateErrorFor } from '../js/core/plate.js';
import { ERROR_MESSAGES, messageFor } from '../js/api/errors.js';

// ---------------------------------------------------------------------------
// DOM จำลอง (แบบเดียวกับ ticket-ui.test.mjs) — component สร้าง element ผ่าน document.createElement
class FakeNode {
  constructor(tagName, text = '') {
    this.tagName = tagName;
    this.children = [];
    this.attributes = {};
    this.listeners = {};
    this._text = text;
    this._className = '';
  }
  set className(value) { this._className = value; this.attributes.class = value; }
  get className() { return this._className; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  hasAttribute(name) { return name in this.attributes; }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = [...nodes]; }
  get textContent() { return this._text + this.children.map((child) => child.textContent).join(''); }
}

globalThis.Node = FakeNode;
globalThis.document = {
  createElement: (tag) => new FakeNode(tag),
  createTextNode: (text) => new FakeNode('#text', String(text)),
};

function findAll(node, predicate, out = []) {
  if (predicate(node)) out.push(node);
  for (const child of node.children) findAll(child, predicate, out);
  return out;
}
const find = (node, predicate) => findAll(node, predicate)[0] || null;
const byClass = (node, name) => find(node, (n) => n.className?.split(/\s+/).includes(name));
const confirmButton = (root) => find(root, (n) => n.tagName === 'button' && /ยืนยันการจอง|กำลังดำเนินการ/.test(n.textContent));

const baseSummary = {
  date: '2026-11-20', start: '09:00', end: '10:00', plate: '1กข 1234', vehicleType: 'รถยนต์',
};

// ---------------------------------------------------------------------------
// กลุ่ม A — กดผิด (BookingSummary + ปุ่มยืนยัน)

test('UI-01 ยังไม่เลือกช่อง → ปุ่มยืนยันกดไม่ได้ และบอกให้เลือกช่อง', () => {
  const view = BookingSummary({ summary: { ...baseSummary } });
  const button = confirmButton(view);
  assert.ok(button, 'มีปุ่มยืนยันการจอง');
  assert.ok(button.hasAttribute('disabled'), 'ปุ่มต้อง disabled เมื่อยังไม่เลือกช่อง');
  assert.match(view.textContent, /ยังไม่ได้เลือกช่องจอด กรุณาแตะเลือกช่องที่ต้องการในผัง/);
});

test('UI-02 เลือกช่องว่างครบแล้ว → ปุ่มกดได้ และกดแล้วเรียก onConfirm 1 ครั้ง', () => {
  let confirmed = 0;
  const view = BookingSummary({
    summary: { ...baseSummary, slotLabel: 'A1', zoneName: 'โซน A', slotStatus: 'free' },
    onConfirm: () => { confirmed += 1; },
  });
  const button = confirmButton(view);
  assert.equal(button.hasAttribute('disabled'), false);
  assert.match(view.textContent, /ช่องว่างตลอดช่วงเวลาที่เลือก พร้อมทำการจอง/);
  button.listeners.click();
  assert.equal(confirmed, 1);
});

test('UI-03 ระหว่างกำลังส่ง (busy) → ปุ่มเป็น "กำลังดำเนินการ…" และกดซ้ำไม่ได้', () => {
  const view = BookingSummary({
    summary: { ...baseSummary, slotLabel: 'A1', slotStatus: 'free' },
    busy: true,
  });
  const button = confirmButton(view);
  assert.equal(button.textContent, 'กำลังดำเนินการ…');
  assert.ok(button.hasAttribute('disabled'));
});

test('UI-04 เลือกช่องที่เต็มตลอดช่วง → เตือนว่าระบบจะไม่รับการจอง', () => {
  const view = BookingSummary({ summary: { ...baseSummary, slotLabel: 'A3', slotStatus: 'booked' } });
  assert.match(view.textContent, /ไม่ว่างในช่วงเวลานี้ ระบบจะไม่รับการจอง/);
  assert.equal(byClass(view, 'booking-summary__note--bad')?.getAttribute('role'), 'status');
});

test('UI-05 เลือกช่องที่ติดจองบางช่วง → บอกช่วงที่ติดจองและแนะนำให้ปรับเวลา', () => {
  const view = BookingSummary({
    summary: { ...baseSummary, slotLabel: 'B1', slotStatus: 'partial', slotBusy: [{ start: '09:00', end: '09:30' }] },
  });
  assert.match(view.textContent, /ติดจองช่วง 09:00–09:30 น\. ลองปรับเปลี่ยนเวลา/);
});

test('UI-06 สรุปการจองแสดงช่อง ทะเบียน และประเภทรถที่เลือก', () => {
  const view = BookingSummary({
    summary: { ...baseSummary, slotLabel: 'A1', zoneName: 'โซน A', slotStatus: 'free', vehicleType: 'มอเตอร์ไซค์' },
  });
  assert.match(view.textContent, /โซน A/);
  assert.match(view.textContent, /A1/);
  assert.match(view.textContent, /1กข 1234/);
  assert.match(view.textContent, /มอเตอร์ไซค์/);
});

// ---------------------------------------------------------------------------
// กลุ่ม B — ผังลานจอด (ParkingLot / SlotBay)

const zones = [
  { id: 1, name: 'โซน A', slots: [{ id: 1, label: 'A1' }, { id: 2, label: 'A2' }, { id: 3, label: 'A3' }, { id: 4, label: 'A4' }] },
  { id: 2, name: 'โซน B', slots: [{ id: 5, label: 'B1' }, { id: 6, label: 'B2' }] },
];
const availability = {
  slots: [
    { id: 1, status: 'free', busy: [] },
    { id: 2, status: 'free', busy: [] },
    { id: 3, status: 'booked', busy: [{ start: '09:00', end: '10:00' }] },
    { id: 4, status: 'partial', busy: [{ start: '09:00', end: '09:30' }] },
    { id: 5, status: 'booked', busy: [{ start: '09:00', end: '10:00' }] },
    { id: 6, status: 'booked', busy: [{ start: '09:00', end: '10:00' }] },
  ],
  zones: [
    { id: 1, free: 2, total: 4, full: false },
    { id: 2, free: 0, total: 2, full: true },
  ],
};
const zoneEl = (lot, id) => find(lot, (n) => n.getAttribute('data-zone') === String(id));
const slotEl = (lot, id) => find(lot, (n) => n.getAttribute('data-slot') === String(id));

test('UI-07 หัวโซนแสดง "ว่าง x/y" และโซนที่เต็มแสดงป้าย "เต็ม"', () => {
  const lot = ParkingLot({ zones, availability });
  assert.equal(byClass(zoneEl(lot, 1), 'parking-lot__count')?.textContent, 'ว่าง 2/4');
  const fullCount = byClass(zoneEl(lot, 2), 'parking-lot__count');
  assert.equal(fullCount?.textContent, 'เต็ม');
  assert.ok(fullCount.className.includes('parking-lot__count--full'));
});

test('UI-08 ช่องบอกสถานะเป็นข้อความ (ไม่พึ่งสีอย่างเดียว) สำหรับโปรแกรมอ่านหน้าจอ', () => {
  const lot = ParkingLot({ zones, availability });
  assert.equal(slotEl(lot, 1).getAttribute('aria-label'), 'ช่อง A1 ว่าง');
  assert.equal(slotEl(lot, 3).getAttribute('aria-label'), 'ช่อง A3 เต็ม (ติดจอง 09:00–10:00 น.)');
  assert.equal(slotEl(lot, 4).getAttribute('aria-label'), 'ช่อง A4 ติดจอง (ติดจอง 09:00–09:30 น.)');
});

test('UI-09 กดช่องบนผัง → ส่ง id ช่องกลับ และช่องที่เลือกมี aria-pressed=true', () => {
  const picked = [];
  const lot = ParkingLot({ zones, availability, onSelectSlot: (id) => picked.push(id) });
  slotEl(lot, 2).listeners.click();
  assert.deepEqual(picked, [2]);

  const selectedLot = ParkingLot({ zones, availability, selectedSlotId: 2 });
  assert.equal(slotEl(selectedLot, 2).getAttribute('aria-pressed'), 'true');
  assert.equal(slotEl(selectedLot, 1).getAttribute('aria-pressed'), 'false');
});

test('UI-10 ช่องบนผังเป็น <button type="button"> จึงใช้ Tab/Enter/Space ได้', () => {
  const lot = ParkingLot({ zones, availability });
  const bays = findAll(lot, (n) => n.getAttribute('data-slot') !== null);
  assert.equal(bays.length, 6);
  for (const bay of bays) {
    assert.equal(bay.tagName, 'button');
    assert.equal(bay.getAttribute('type'), 'button');
  }
});

test('UI-11 ระหว่างโหลดสถานะ (availability = null) ผังยังแสดงช่องได้ ไม่มีหัวโซนนับผิด', () => {
  const lot = ParkingLot({ zones, availability: null });
  assert.equal(findAll(lot, (n) => n.getAttribute('data-slot') !== null).length, 6);
  assert.equal(byClass(lot, 'parking-lot__count'), null);
});

// ---------------------------------------------------------------------------
// กลุ่ม C — กรอกข้อมูลผิด (ทะเบียนรถ)

test('UI-12 ทะเบียนว่างหรือมีแต่ช่องว่าง → "กรุณากรอกทะเบียนรถ"', () => {
  for (const value of ['', '   ', undefined]) {
    assert.equal(plateErrorFor(value), PLATE_EMPTY_MESSAGE);
  }
  assert.equal(PLATE_EMPTY_MESSAGE, 'กรุณากรอกทะเบียนรถ');
});

test('UI-13 ทะเบียนผิดรูปแบบ → ข้อความบอกตัวอย่างที่ถูกต้อง', () => {
  const invalid = ['ABC 123', '00กก 12', 'ABC 1234', 'กข', '1234', 'กขคง 1234', 'กข 12345', 'กข-1234'];
  for (const plate of invalid) {
    assert.equal(plateErrorFor(plate), PLATE_FORMAT_MESSAGE, `ต้องปฏิเสธ "${plate}"`);
  }
  assert.match(PLATE_FORMAT_MESSAGE, /กข 1234 หรือ 1กข 1234/);
});

test('UI-14 ทะเบียนถูกต้อง → ไม่มี error และตัดช่องว่างเกินให้เรียบร้อย', () => {
  for (const plate of ['กข 1234', '1กข 1234', 'ขค123', 'ก 1', '  1กข   1234 ']) {
    assert.equal(plateErrorFor(plate), '', `ต้องรับ "${plate}"`);
  }
  assert.equal(normalizePlate('  1กข   1234 '), '1กข 1234');
});

// ---------------------------------------------------------------------------
// กลุ่ม D — ข้อความ error จาก Server เป็นภาษาไทย

test('UI-15 error code ของการจองแปลเป็นข้อความไทยครบ', () => {
  const expected = {
    INVALID_PLATE: 'รูปแบบทะเบียนรถไม่ถูกต้อง (ตัวอย่าง: กข 1234 หรือ 1กข 1234)',
    SLOT_CONFLICT: 'ช่องนี้ถูกจองแล้วในช่วงเวลาที่ซ้อนกัน',
    ZONE_FULL: 'โซนนี้เต็มในช่วงเวลาที่เลือก',
    OUTSIDE_HOURS: 'อยู่นอกเวลาเปิดทำการ',
    PAST_TIME: 'ไม่สามารถจองย้อนหลังได้',
    VALIDATION_ERROR: 'ข้อมูลที่กรอกไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง',
  };
  for (const [code, text] of Object.entries(expected)) {
    assert.equal(messageFor({ code, message: 'server message' }), text, code);
  }
  assert.equal(ERROR_MESSAGES.INVALID_PLATE, PLATE_FORMAT_MESSAGE, 'ข้อความทะเบียนผิดฝั่งหน้าเว็บกับ server ต้องตรงกัน');
});

test('UI-16 เชื่อมต่อ server ไม่ได้ → "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้"', () => {
  assert.equal(messageFor(new TypeError('Failed to fetch')), 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
  assert.equal(messageFor({ code: 'UNKNOWN_CODE', message: 'ข้อความจาก server' }), 'ข้อความจาก server');
});
