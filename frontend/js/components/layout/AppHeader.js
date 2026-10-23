/**
 * AppHeader — หัวเว็บสีแดง มธ. + โลโก้ + เมนูนำทาง (Home, ลงทะเบียนรถ, จองที่จอด, ประวัติ)
 * Owner: Dev 1 | Ticket: LY-01 | Priority: P0
 * @param { {activeRoute:string, student?:{name:string}|null} } props
 * @returns {HTMLElement}
 * Done when: โลโก้มุมซ้ายใช้ไฟล์ทางการ, เมนูไฮไลต์หน้าปัจจุบัน, พับเป็นแฮมเบอร์เกอร์บนมือถือ, แล้วลบ #dev-nav ใน index.html
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .app-header- ใน AppHeader.css)
 */
import { h } from '../../core/dom.js';
const links = [
  ['#/', 'หน้าแรก', '/'], ['#/vehicle', 'ลงทะเบียนรถ', '/vehicle'],
  ['#/booking', 'จองที่จอด', '/booking'],
  ['#/history', 'ประวัติ', '/history'],
];
export function AppHeader({ activeRoute = '/', unreadCount = 0, notificationsOpen = false, onToggleNotifications = () => {} } = {}) {
  const nav = h('nav', { class: 'app-header-nav', 'aria-label': 'เมนูหลัก' });
  for (const [href, title, path] of links) {
    const active = path === '/' ? activeRoute === '/' : activeRoute.startsWith(path);
    nav.append(h('a', {
      href, class: `app-header-link${active ? ' app-header-link--active' : ''}`,
      ...(active ? { 'aria-current': 'page' } : {}),
    }, title));
  }
  const menuButton = h('button', {
    type: 'button', class: 'app-header-toggle', 'aria-expanded': 'false',
    'aria-label': 'เปิดเมนู', onClick: () => {
      const expanded = nav.classList.toggle('app-header-nav--open');
      menuButton.setAttribute('aria-expanded', String(expanded));
    },
  }, '☰');
  const count = Math.max(0, Number(unreadCount) || 0);
  const notificationButton = h('button', {
    type: 'button',
    class: 'app-header-notifications-toggle',
    'aria-label': `การแจ้งเตือน มีรายการที่ยังไม่อ่าน ${count} รายการ`,
    'aria-expanded': String(notificationsOpen),
    'aria-controls': 'header-notification-list',
    onClick: onToggleNotifications,
  },
  h('span', { class: 'app-header-notifications-icon', 'aria-hidden': 'true' }, '🔔'),
  h('span', { class: 'app-header-notifications-label' }, 'แจ้งเตือน'),
  count > 0 ? h('span', { class: 'app-header-notifications-count', 'aria-hidden': 'true' }, count > 99 ? '99+' : count) : null,
  );
  return h('div', { class: 'app-header-root' },
    h('div', { class: 'app-header-inner' },
      h('a', { class: 'app-header-brand', href: '#/' }, 'จองที่จอดรถ มธ.'),
      menuButton, notificationButton, nav,
    ),
  );
}
