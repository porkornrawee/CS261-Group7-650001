/**
 * US8 — แสดงตำแหน่งช่องจอดที่จอง (T20 ไฮไลต์บนผัง, T21 TC-US8-01/02) + ผูกกับเวลาจริงของหน้าจอง
 * รัน: node --test frontend/tests/
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { ParkingLot } from '../js/features/booking/ParkingLot.js';
import { ReservationTable } from '../js/features/history/ReservationTable.js';
import { TimeChips } from '../js/features/booking/TimeChips.js';
import { isPastStart, firstBookableStart } from '../js/core/time.js';

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
  get textContent() { return this._text + this.children.map((c) => c.textContent).join(''); }
  set dataset(_) {}
  get dataset() { return (this._dataset ||= {}); }
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
const hasClass = (n, name) => (n.className || '').split(/\s+/).includes(name);

const zones = [
  { id: 1, name: 'โซน A', slots: [{ id: 1, label: 'A1' }, { id: 2, label: 'A2' }, { id: 3, label: 'A3' }] },
  { id: 2, name: 'โซน B', slots: [{ id: 4, label: 'B1' }, { id: 5, label: 'B2' }] },
];
const slotEl = (lot, id) => findAll(lot, (n) => n.getAttribute('data-slot') === String(id))[0];

test('TC-US8-01 ช่องที่จองถูกไฮไลต์ช่องเดียว มีป้ายหมุดและ aria-label บอกว่าเป็นช่องที่จอง', () => {
  const lot = ParkingLot({ zones, highlightSlotId: 4 });
  const marked = findAll(lot, (n) => hasClass(n, 'slot-bay--highlighted'));
  assert.equal(marked.length, 1);
  assert.equal(marked[0].getAttribute('data-slot'), '4');
  assert.match(marked[0].getAttribute('aria-label'), /ช่องที่คุณจอง/);
  assert.equal(findAll(marked[0], (n) => hasClass(n, 'slot-bay__badge--highlighted')).length, 1, 'ไม่พึ่งสีอย่างเดียว');
  assert.ok(findAll(lot, (n) => /ช่องที่คุณจอง/.test(n.textContent) && hasClass(n, 'parking-lot__legend-item')).length === 1,
    'legend มีรายการ "ช่องที่คุณจอง"');
});

test('TC-US8-02 ไม่ส่ง highlightSlotId หรือช่องไม่อยู่ในผัง → ไม่มีช่องไหนถูกไฮไลต์ และไม่พัง', () => {
  for (const props of [{}, { highlightSlotId: null }, { highlightSlotId: 999 }]) {
    const lot = ParkingLot({ zones, ...props });
    assert.equal(findAll(lot, (n) => hasClass(n, 'slot-bay--highlighted')).length, 0);
  }
  const noHighlight = ParkingLot({ zones });
  assert.equal(findAll(noHighlight, (n) => /ช่องที่คุณจอง/.test(n.textContent) && hasClass(n, 'parking-lot__legend-item')).length, 0);
});

test('รายการจอง: ปุ่ม "ดูตำแหน่งบนผัง" เรียก onShowSlot ด้วยรหัสการจอง และไม่แสดงในรายการที่ยกเลิก', () => {
  const shown = [];
  const table = ReservationTable({
    reservations: [
      { code: 'PK-ACTIVE', slot: 'A1', zone: 'โซน A', date: '2026-11-20', start: '09:00', end: '10:00', status: 'active' },
      { code: 'PK-CANCEL', slot: 'A2', zone: 'โซน A', date: '2026-11-20', start: '09:00', end: '10:00', status: 'cancelled' },
    ],
    onShowSlot: (code) => shown.push(code),
  });
  const buttons = findAll(table, (n) => n.tagName === 'button' && n.textContent === 'ดูตำแหน่งบนผัง');
  assert.equal(buttons.length, 1);
  buttons[0].listeners.click();
  assert.deepEqual(shown, ['PK-ACTIVE']);
});

// ---- เวลาจริง ----
const NOW = new Date(2026, 10, 17, 10, 30); // 17 พ.ย. 2026 10:30

test('isPastStart เทียบกับเวลาจริง: เวลาก่อนปัจจุบันถือว่าผ่านไปแล้ว, วันอื่นไม่เกี่ยว', () => {
  assert.equal(isPastStart('2026-11-17', '10:00', NOW), true);
  assert.equal(isPastStart('2026-11-17', '11:00', NOW), false);
  assert.equal(isPastStart('2026-11-16', '23:00', NOW), true);
  assert.equal(isPastStart('2026-11-18', '08:00', NOW), false);
});

test('firstBookableStart ข้ามชั่วโมงที่ผ่านไปแล้ว และคืน null เมื่อไม่เหลือ', () => {
  assert.equal(firstBookableStart('2026-11-17', 8 * 60, 12 * 60, 60, NOW), '11:00');
  assert.equal(firstBookableStart('2026-11-17', 8 * 60, 10 * 60, 60, NOW), null);
  assert.equal(firstBookableStart('2026-11-18', 8 * 60, 12 * 60, 60, NOW), '08:00');
});

test('TimeChips ปิดชิปเวลาที่ผ่านไปแล้วของวันนี้ แต่วันถัดไปกดได้ทุกชิป', () => {
  const chips = (date) => {
    const root = TimeChips({ value: '', openTime: '08:00', closeTime: '12:00', stepMin: 60, date, now: NOW });
    return findAll(root, (n) => n.tagName === 'button');
  };
  const today = chips('2026-11-17');
  assert.deepEqual(today.map((b) => b.hasAttribute('disabled')), [true, true, true, false]);
  assert.ok(chips('2026-11-18').every((b) => !b.hasAttribute('disabled')));
});
