import test from 'node:test';
import assert from 'node:assert/strict';
import { TicketCard } from '../js/features/ticket/TicketCard.js';
import { TicketPage } from '../js/pages/TicketPage.js';

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
  addEventListener(name, callback) { this.listeners[name] = callback; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = [...nodes]; }
  replaceWith(node) {
    const index = this.parent?.children.indexOf(this) ?? -1;
    if (index >= 0) this.parent.children.splice(index, 1, node);
  }
  remove() {
    const index = this.parent?.children.indexOf(this) ?? -1;
    if (index >= 0) this.parent.children.splice(index, 1);
  }
  get textContent() { return this._text + this.children.map((child) => child.textContent).join(''); }
}

function attachParents(node) {
  for (const child of node.children) {
    child.parent = node;
    attachParents(child);
  }
}
function find(node, predicate) {
  if (predicate(node)) return node;
  for (const child of node.children) {
    const result = find(child, predicate);
    if (result) return result;
  }
  return null;
}
function byClass(node, name) {
  return find(node, (item) => item.className?.split(/\s+/).includes(name));
}

globalThis.Node = FakeNode;
globalThis.document = {
  createElement: (tag) => new FakeNode(tag),
  createTextNode: (text) => new FakeNode('#text', String(text)),
};
let response;
globalThis.window = { location: { search: '?mock=1' }, print() {} };
globalThis.fetch = async () => ({ json: async () => structuredClone(response) });

const reservation = {
  code: 'PK-ABCD2345', user_name: 'สมชาย ใจดี', slot: 'A1', zone: 'โซน A',
  date: '2026-10-17', start: '09:00', end: '10:00',
};

test('TicketCard แสดงรายละเอียด QR ดาวน์โหลด QR และสั่งพิมพ์ได้', () => {
  let printCount = 0;
  window.print = () => { printCount += 1; };
  const card = TicketCard({ reservation, qrSrc: '/api/reservations/PK-ABCD2345/qr.png' });
  attachParents(card);

  assert.match(card.textContent, /PK-ABCD2345/);
  assert.match(card.textContent, /โซน A/);
  assert.match(card.textContent, /A1/);
  assert.match(card.textContent, /17 ต\.ค\. 2569/);
  assert.ok(find(card, (node) => node.tagName === 'img' && node.getAttribute('alt')?.endsWith('PK-ABCD2345')));
  const download = find(card, (node) => node.getAttribute('download') === 'PK-ABCD2345.png');
  assert.ok(download, 'มีลิงก์ดาวน์โหลดไฟล์ QR');
  const print = byClass(card, 'ticket-card__print');
  assert.ok(print, 'มีปุ่มพิมพ์แยกจากปุ่มดาวน์โหลด');
  print.listeners.click();
  assert.equal(printCount, 1);
});

test('TicketCard แสดงข้อความและซ่อนดาวน์โหลดเมื่อโหลด QR ไม่สำเร็จ', () => {
  const card = TicketCard({ reservation, qrSrc: '/missing.png' });
  attachParents(card);
  const image = find(card, (node) => node.tagName === 'img');
  image.listeners.error({ currentTarget: image });
  assert.match(card.textContent, /โหลดภาพ QR ไม่สำเร็จ/);
  assert.equal(find(card, (node) => node.getAttribute('download') !== null), null);
});

test('TicketPage เปิดด้วยสถานะ loading แล้วแสดงบัตรและ QR จาก response', async () => {
  response = {
    ok: true,
    reservation,
    qr_data_uri: 'data:image/png;base64,cXVpY2stdGVzdA==',
  };
  const page = TicketPage({ params: { code: reservation.code } });
  const body = byClass(page, 'ticket-page__body');
  assert.equal(body.getAttribute('aria-busy'), 'true');
  assert.match(body.textContent, /กำลังโหลดบัตรจอง/);

  await new Promise((resolve) => setTimeout(resolve, 350));
  attachParents(page);
  assert.equal(body.getAttribute('aria-busy'), 'false');
  assert.ok(byClass(page, 'ticket-card'));
  assert.equal(byClass(page, 'ticket-card__qr')?.getAttribute('src'), response.qr_data_uri);
});

test('TicketPage แสดง error alert และยุติสถานะ loading เมื่อ API ล้มเหลว', async () => {
  response = { ok: false, error: { code: 'NOT_FOUND', message: 'ไม่พบรหัสการจองนี้' } };
  const page = TicketPage({ params: { code: 'PK-NOPE0000' } });
  const body = byClass(page, 'ticket-page__body');
  assert.equal(body.getAttribute('aria-busy'), 'true');

  await new Promise((resolve) => setTimeout(resolve, 350));
  assert.equal(body.getAttribute('aria-busy'), 'false');
  assert.ok(find(body, (node) => node.getAttribute('role') === 'alert'));
  assert.match(body.textContent, /ไม่พบรหัสการจองนี้/);
});
test('TicketPage ใช้ QR endpoint เมื่อ detail response ไม่มี qr_data_uri', async () => {
  response = { ok: true, reservation };
  const page = TicketPage({ params: { code: reservation.code } });

  await new Promise((resolve) => setTimeout(resolve, 350));
  attachParents(page);
  assert.equal(
    byClass(page, 'ticket-card__qr')?.getAttribute('src'),
    '/api/reservations/PK-ABCD2345/qr.png',
  );
});

