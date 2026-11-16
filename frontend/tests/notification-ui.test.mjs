import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

class FakeNode {
  constructor(tagName, text = '') {
    this.tagName = tagName;
    this.children = [];
    this.attributes = {};
    this.listeners = {};
    this._text = text;
    this.parent = null;
  }
  set className(value) { this.attributes.class = value; }
  get className() { return this.attributes.class || ''; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  append(...nodes) { for (const n of nodes) { n.parent = this; this.children.push(n); } }
  replaceWith(node) {
    const index = this.parent?.children.indexOf(this) ?? -1;
    if (index >= 0) { node.parent = this.parent; this.parent.children.splice(index, 1, node); }
  }
  get textContent() { return this._text + this.children.map((c) => c.textContent).join(''); }
  get disabled() { return 'disabled' in this.attributes; }
  set disabled(v) { if (v) this.attributes.disabled = ''; else delete this.attributes.disabled; }
}
function find(node, predicate) {
  if (predicate(node)) return node;
  for (const child of node.children) { const r = find(child, predicate); if (r) return r; }
  return null;
}
function findAll(node, predicate, out = []) {
  if (predicate(node)) out.push(node);
  for (const child of node.children) findAll(child, predicate, out);
  return out;
}
const hasClass = (node, name) => node.className.split(/\s+/).includes(name);

globalThis.Node = FakeNode;
globalThis.document = {
  createElement: (tag) => new FakeNode(tag),
  createElementNS: (_ns, tag) => new FakeNode(tag),
  createTextNode: (text) => new FakeNode('#text', String(text)),
};

const { Icon, ICON_NAMES } = await import('../js/components/ui/Icon.js');
const { NotificationList, notificationMeta, relativeTime, resetNotificationFilter } =
  await import('../js/features/notification/NotificationList.js');

const NOW = Date.parse('2026-10-20T09:00:00');
const sample = [
  { id: 1, type: 'near_start', message: 'การจองช่อง A1 จะเริ่มเวลา 09:00', created_at: '2026-10-20T08:45:00', read_at: null },
  { id: 2, type: 'cancelled', message: 'ยกเลิกการจองช่อง B2 แล้ว', created_at: '2026-10-19T09:00:00', read_at: '2026-10-19T10:00:00' },
  { id: 3, type: 'near_expiry', message: 'การจองช่อง A3 ใกล้หมดเวลา', created_at: '2026-10-20T08:59:40', read_at: null },
];

test('Icon: ไอคอนตกแต่งซ่อนจาก screen reader, ไอคอนที่มี label เป็น role=img', () => {
  const decorative = Icon('bell');
  assert.equal(decorative.getAttribute('aria-hidden'), 'true');
  assert.equal(decorative.getAttribute('stroke'), 'currentColor');
  const labelled = Icon('bell', { label: 'การแจ้งเตือน' });
  assert.equal(labelled.getAttribute('role'), 'img');
  assert.equal(labelled.getAttribute('aria-label'), 'การแจ้งเตือน');
  assert.equal(labelled.getAttribute('aria-hidden'), null);
  assert.ok(ICON_NAMES.length >= 15);
  assert.equal(Icon('ไม่มีชื่อนี้').getAttribute('viewBox'), '0 0 24 24'); // fallback ไม่พัง
});

test('relativeTime แสดงเวลาแบบสัมพัทธ์เป็นภาษาไทย', () => {
  assert.equal(relativeTime('2026-10-20T08:59:40', NOW), 'เมื่อสักครู่');
  assert.equal(relativeTime('2026-10-20T08:45:00', NOW), '15 นาทีที่แล้ว');
  assert.equal(relativeTime('2026-10-20T06:00:00', NOW), '3 ชม.ที่แล้ว');
  assert.equal(relativeTime('2026-10-18T09:00:00', NOW), '2 วันที่แล้ว');
  assert.equal(relativeTime(null, NOW), '');
});

test('notificationMeta แมปประเภทจาก backend เป็นไอคอนและโทนสี', () => {
  assert.deepEqual(notificationMeta('near_start').icon, 'clock');
  assert.deepEqual(notificationMeta('near_expiry').tone, 'warn');
  assert.deepEqual(notificationMeta('auto_cancelled').tone, 'danger');
  assert.deepEqual(notificationMeta('ประเภทใหม่').icon, 'bell');
});

test('NotificationList แสดงข้อความ ประเภท และปุ่มอ่านเฉพาะรายการที่ยังไม่อ่าน', () => {
  resetNotificationFilter();
  const read = [];
  const list = NotificationList({ notifications: sample, onRead: (id) => read.push(id), now: NOW });
  assert.match(list.textContent, /การจองช่อง A1 จะเริ่มเวลา 09:00/);
  assert.match(list.textContent, /ใกล้ถึงเวลาจอง/);
  assert.match(list.textContent, /15 นาทีที่แล้ว/);
  const buttons = findAll(list, (n) => hasClass(n, 'notification-list__read'));
  assert.equal(buttons.length, 2);
  buttons[0].listeners.click();
  assert.deepEqual(read, [1]);
  assert.equal(findAll(list, (n) => hasClass(n, 'notification-list__item--unread')).length, 2);
});

test('NotificationList: อ่านทั้งหมดส่ง id ที่ยังไม่อ่านครบ และปิดปุ่มเมื่อไม่มีค้างอ่าน', () => {
  resetNotificationFilter();
  let ids = null;
  const list = NotificationList({ notifications: sample, onReadAll: (x) => { ids = x; }, now: NOW });
  const all = find(list, (n) => hasClass(n, 'notification-list__read-all'));
  assert.equal(all.disabled, false);
  all.listeners.click();
  assert.deepEqual(ids, [1, 3]);

  const none = NotificationList({ notifications: [sample[1]], now: NOW });
  assert.equal(find(none, (n) => hasClass(n, 'notification-list__read-all')).disabled, true);
});

test('NotificationList: แท็บ "ยังไม่อ่าน" กรองรายการและมี empty state', () => {
  resetNotificationFilter();
  const root = new FakeNode('div');
  const list = NotificationList({ notifications: sample, now: NOW });
  root.append(list);
  const tab = findAll(list, (n) => hasClass(n, 'notification-list__tab'))[1];
  tab.listeners.click();
  const filtered = root.children[0];
  assert.equal(findAll(filtered, (n) => hasClass(n, 'notification-list__item')).length, 2);
  assert.doesNotMatch(filtered.textContent, /ยกเลิกการจองช่อง B2/);

  resetNotificationFilter();
  const empty = NotificationList({ notifications: [], now: NOW });
  assert.match(empty.textContent, /ยังไม่มีการแจ้งเตือน/);
});

test('ไม่มีอิโมจิในซอร์สหน้าเว็บ (ใช้ Icon แทน)', () => {
  const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{27A1}\u{FE0F}]/u;
  const offenders = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) { walk(full); continue; }
      if (!full.endsWith('.js') && !full.endsWith('.css')) continue;
      const lines = readFileSync(full, 'utf8').split('\n');
      lines.forEach((line, i) => {
        const code = line.replace(/^\s*(\*|\/\/).*/, '');   // ข้ามคอมเมนต์
        if (emoji.test(code)) offenders.push(`${full}:${i + 1}`);
      });
    }
  };
  walk(new URL('../js', import.meta.url).pathname);
  assert.deepEqual(offenders, []);
});
