import test from 'node:test';
import assert from 'node:assert/strict';
import { ReservationTable } from '../js/features/history/ReservationTable.js';

class FakeNode {
  constructor(tagName, text = '') {
    this.tagName = tagName;
    this.children = [];
    this.attributes = {};
    this._text = text;
    this._className = '';
  }
  set className(value) { this._className = value; this.attributes.class = value; }
  get className() { return this._className; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  addEventListener() {}
  append(...nodes) { this.children.push(...nodes); }
  get textContent() { return this._text + this.children.map((child) => child.textContent).join(''); }
}

globalThis.Node = FakeNode;
globalThis.document = {
  createElement: (tag) => new FakeNode(tag),
  createTextNode: (text) => new FakeNode('#text', String(text)),
};

function findAll(node, predicate, results = []) {
  if (predicate(node)) results.push(node);
  for (const child of node.children) findAll(child, predicate, results);
  return results;
}

test('ReservationTable renders localized status badges', () => {
  const statuses = [
    ['completed', 'เสร็จสิ้น', 'badge-root--success'],
    ['cancelled', 'ยกเลิกเอง', 'badge-root--danger'],
    ['auto_cancelled', 'ยกเลิกอัตโนมัติ', 'badge-root--warning'],
  ];
  const table = ReservationTable({
    reservations: statuses.map(([status]) => ({ status, code: `PK-${status}` })),
  });
  const badges = findAll(table, (node) => node.className?.includes('badge-root--'));

  assert.deepEqual(badges.map((badge) => badge.textContent), statuses.map(([, label]) => label));
  assert.deepEqual(
    badges.map((badge) => badge.className),
    statuses.map(([, , tone]) => `badge-root ${tone}`),
  );
});

test('ReservationTable has an empty state when a status has no reservations', () => {
  const table = ReservationTable({ reservations: [] });
  assert.match(table.textContent, /ยังไม่มีประวัติการจองในสถานะนี้/);
});
