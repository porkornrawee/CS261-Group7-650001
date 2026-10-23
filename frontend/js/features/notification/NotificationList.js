/**
 * NotificationList — รายการแจ้งเตือนในเมนู AppHeader
 * Owner: Dev 4 | Ticket: US4
 * @param {{notifications: object[], onRead: (id:string|number)=>void}} props
 * @returns {HTMLElement}
 * Done when: แสดงข้อความแจ้งเตือนและทำเครื่องหมายว่าอ่านแล้วได้
 */
import { h } from '../../core/dom.js';

function formatCreatedAt(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
}

export function NotificationList({ notifications = [], onRead = () => {} } = {}) {
  const list = h('section', {
    id: 'header-notification-list',
    class: 'notification-list',
    'aria-label': 'รายการแจ้งเตือน',
  }, h('h2', { class: 'notification-list__title' }, 'การแจ้งเตือน'));

  if (!notifications.length) {
    list.append(h('p', { class: 'notification-list__empty' }, 'ยังไม่มีการแจ้งเตือน'));
    return list;
  }

  const items = h('ul', { class: 'notification-list__items' });
  for (const notification of notifications) {
    const unread = !notification.read_at;
    const item = h('li', {
      class: `notification-list__item${unread ? ' notification-list__item--unread' : ''}`,
    },
    h('p', { class: 'notification-list__message' }, notification.message || ''),
    h('time', {
      class: 'notification-list__time',
      ...(notification.created_at ? { datetime: notification.created_at } : {}),
    }, formatCreatedAt(notification.created_at)),
    unread ? h('button', {
      type: 'button',
      class: 'notification-list__read',
      onClick: () => onRead(notification.id),
    }, 'ทำเครื่องหมายว่าอ่านแล้ว') : null,
    );
    items.append(item);
  }
  list.append(items);
  return list;
}
