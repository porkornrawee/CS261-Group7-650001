/**
 * NotificationList — แผงแจ้งเตือนในเมนู AppHeader
 * Owner: Dev 4 | Ticket: US4
 * @param {{
 *   notifications: object[],
 *   onRead: (id:string|number)=>void,
 *   onReadAll?: (ids:Array<string|number>)=>void,
 *   now?: number            เวลาปัจจุบัน (ms) — ใช้ในเทสต์
 * }} props
 * @returns {HTMLElement}
 * Done when: แสดงไอคอนตามประเภท ข้อความ เวลาแบบสัมพัทธ์ กรองยังไม่อ่าน อ่านทีละรายการ/ทั้งหมดได้
 */
import { h } from '../../core/dom.js';
import { Icon } from '../../components/ui/Icon.js';

/** ประเภทแจ้งเตือนจาก backend (notification_service.py) → ไอคอน/โทนสี/ป้ายชื่อ */
const TYPE_META = {
  near_start: { icon: 'clock', tone: 'info', label: 'ใกล้ถึงเวลาจอง' },
  near_expiry: { icon: 'hourglass', tone: 'warn', label: 'ใกล้หมดเวลา' },
  cancelled: { icon: 'x-circle', tone: 'danger', label: 'ยกเลิกการจอง' },
  auto_cancelled: { icon: 'x-circle', tone: 'danger', label: 'ยกเลิกอัตโนมัติ' },
  zone_full: { icon: 'map-pin', tone: 'muted', label: 'โซนเต็ม' },
};
const DEFAULT_META = { icon: 'bell', tone: 'info', label: 'แจ้งเตือน' };

export function notificationMeta(type) {
  return TYPE_META[type] || DEFAULT_META;
}

/** "เมื่อสักครู่" / "5 นาทีที่แล้ว" / "2 ชม.ที่แล้ว" / วันที่ (ถ้าเกิน 7 วัน) */
export function relativeTime(value, now = Date.now()) {
  if (!value) return '';
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return String(value);
  const minutes = Math.floor((now - time) / 60000);
  if (minutes < 1) return 'เมื่อสักครู่';
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชม.ที่แล้ว`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} วันที่แล้ว`;
  return new Date(time).toLocaleDateString('th-TH', { dateStyle: 'medium' });
}

function absoluteTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value || '')
    : date.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
}

// ตัวกรองที่เลือกค้างไว้ข้ามการ render ใหม่ของ header (poll ทุก 45 วินาที)
let activeFilter = 'all';
export function resetNotificationFilter() { activeFilter = 'all'; }

export function NotificationList({
  notifications = [], onRead = () => {}, onReadAll = () => {}, now = Date.now(),
} = {}) {
  const unread = notifications.filter((n) => !n.read_at);
  const filter = activeFilter === 'unread' ? 'unread' : 'all';
  const visible = filter === 'unread' ? unread : notifications;

  const list = h('section', {
    id: 'header-notification-list',
    class: 'notification-list',
    'aria-label': 'รายการแจ้งเตือน',
  });

  const markAll = h('button', {
    type: 'button',
    class: 'notification-list__read-all',
    disabled: unread.length === 0,
    onClick: () => onReadAll(unread.map((n) => n.id)),
  }, Icon('check-all', { size: 16 }), 'อ่านทั้งหมด');

  list.append(h('header', { class: 'notification-list__head' },
    h('h2', { class: 'notification-list__title' }, Icon('bell', { size: 18 }), 'การแจ้งเตือน'),
    markAll,
  ));

  const tab = (id, text) => h('button', {
    type: 'button',
    class: `notification-list__tab${filter === id ? ' notification-list__tab--active' : ''}`,
    'aria-pressed': String(filter === id),
    onClick: () => {
      activeFilter = id;
      list.replaceWith(NotificationList({ notifications, onRead, onReadAll, now }));
    },
  }, text);
  list.append(h('div', { class: 'notification-list__tabs', role: 'group', 'aria-label': 'กรองการแจ้งเตือน' },
    tab('all', 'ทั้งหมด'),
    tab('unread', `ยังไม่อ่าน${unread.length ? ` (${unread.length})` : ''}`),
  ));

  if (!visible.length) {
    list.append(h('div', { class: 'notification-list__empty' },
      h('span', { class: 'notification-list__empty-icon' }, Icon('bell-off', { size: 28 })),
      h('p', null, filter === 'unread' ? 'ไม่มีการแจ้งเตือนที่ยังไม่อ่าน' : 'ยังไม่มีการแจ้งเตือน'),
    ));
    return list;
  }

  const items = h('ul', { class: 'notification-list__items' });
  for (const notification of visible) {
    const isUnread = !notification.read_at;
    const meta = notificationMeta(notification.type);
    items.append(h('li', {
      class: `notification-list__item notification-list__item--${meta.tone}${isUnread ? ' notification-list__item--unread' : ''}`,
    },
    h('span', { class: 'notification-list__badge' }, Icon(meta.icon, { size: 20 })),
    h('div', { class: 'notification-list__body' },
      h('p', { class: 'notification-list__type' }, meta.label),
      h('p', { class: 'notification-list__message' }, notification.message || ''),
      h('time', {
        class: 'notification-list__time',
        title: absoluteTime(notification.created_at),
        ...(notification.created_at ? { datetime: notification.created_at } : {}),
      }, relativeTime(notification.created_at, now)),
    ),
    isUnread ? h('button', {
      type: 'button',
      class: 'notification-list__read',
      'aria-label': 'ทำเครื่องหมายว่าอ่านแล้ว',
      title: 'ทำเครื่องหมายว่าอ่านแล้ว',
      onClick: () => onRead(notification.id),
    }, Icon('check', { size: 18 })) : null,
    ));
  }
  list.append(items);
  return list;
}
