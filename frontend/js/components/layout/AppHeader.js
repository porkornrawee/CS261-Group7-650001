/**
 * AppHeader — แถบหัวเว็บสีแดง "Parking" + เมนู + ไอคอนผู้ใช้ (Figma: Computer Home / HomeLogin)
 * Owner: Dev 1 | Ticket: LY-01, US11
 * @param {{
 *   activeRoute?:string, activeHash?:string,
 *   user?:{student_id:string,name?:string}|null,
 *   unreadCount?:number, notificationsOpen?:boolean, onToggleNotifications?:()=>void,
 *   onLogout?:()=>void
 * }} props
 * - ยังไม่ล็อกอิน: แสดงเฉพาะเมนู (ตาม Figma "Computer Home") กดเมนูที่ต้องล็อกอินจะถูกพาไปหน้า login
 * - ล็อกอินแล้ว: มีกระดิ่งแจ้งเตือน (US4 ของ Dev 4) + ไอคอนผู้ใช้ ▲ เปิดเมนู "ออกจากระบบ"
 */
import { h, s } from '../../core/dom.js';

export const NAV_LINKS = [
  { href: '#/', label: 'หน้าแรก', match: (path) => path === '/' },
  { href: '#/vehicle', label: 'ลงทะเบียนรถ', match: (path) => path.startsWith('/vehicle') },
  { href: '#/history?status=active', label: 'บัตรจอง', match: (path, hash) => path.startsWith('/ticket') || (path === '/history' && hash.includes('status=active')) },
  { href: '#/history', label: 'ประวัติ', match: (path, hash) => path === '/history' && !hash.includes('status=active') },
];

function userIcon() {
  return s('svg', { class: 'app-header-user-icon', viewBox: '0 0 40 40', 'aria-hidden': 'true', focusable: 'false' },
    s('circle', { cx: 20, cy: 20, r: 20, fill: 'currentColor' }),
    s('circle', { cx: 20, cy: 15, r: 6.5, fill: 'var(--primary)' }),
    s('path', { d: 'M8.5 32c1.8-6 6.2-9 11.5-9s9.7 3 11.5 9a17 17 0 0 1-23 0z', fill: 'var(--primary)' }));
}

function chevron() {
  return s('svg', { class: 'app-header-chevron', viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' },
    s('path', { d: 'M5 15l7-7 7 7', fill: 'none', stroke: 'currentColor', 'stroke-width': 3.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
}

function bellIcon() {
  return s('svg', { viewBox: '0 0 24 24', width: 24, height: 24, 'aria-hidden': 'true', focusable: 'false' },
    s('path', { d: 'M12 22a2.5 2.5 0 0 0 2.4-2h-4.8A2.5 2.5 0 0 0 12 22zm7-6V11a7 7 0 0 0-5.5-6.8V3.5a1.5 1.5 0 0 0-3 0v.7A7 7 0 0 0 5 11v5l-2 2v1h18v-1z', fill: 'currentColor' }));
}

export function AppHeader({
  activeRoute = '/',
  activeHash = '',
  user = null,
  unreadCount = 0,
  notificationsOpen = false,
  onToggleNotifications = () => {},
  onLogout = () => {},
} = {}) {
  const nav = h('nav', { class: 'app-header-nav', id: 'app-header-nav', 'aria-label': 'เมนูหลัก' });
  for (const link of NAV_LINKS) {
    const active = link.match(activeRoute, activeHash);
    nav.append(h('a', {
      href: link.href,
      class: `app-header-link${active ? ' app-header-link--active' : ''}`,
      ...(active ? { 'aria-current': 'page' } : {}),
    }, link.label));
  }

  const menuButton = h('button', {
    type: 'button',
    class: 'app-header-toggle',
    'aria-expanded': 'false',
    'aria-controls': 'app-header-nav',
    'aria-label': 'เปิดเมนู',
    onClick: () => {
      const expanded = nav.classList.toggle('app-header-nav--open');
      menuButton.setAttribute('aria-expanded', String(expanded));
    },
  }, '☰');

  const right = h('div', { class: 'app-header-right' }, nav);

  if (user) {
    const count = Math.max(0, Number(unreadCount) || 0);
    right.append(h('button', {
      type: 'button',
      class: 'app-header-notifications-toggle',
      'aria-label': `การแจ้งเตือน มีรายการที่ยังไม่อ่าน ${count} รายการ`,
      'aria-expanded': String(notificationsOpen),
      'aria-controls': 'header-notification-list',
      onClick: onToggleNotifications,
    },
      bellIcon(),
      count > 0 ? h('span', { class: 'app-header-notifications-count', 'aria-hidden': 'true' }, count > 99 ? '99+' : count) : null,
    ));

    const menu = h('div', { class: 'app-header-user-menu', id: 'app-header-user-menu', hidden: true },
      h('p', { class: 'app-header-user-name' }, user.name || 'ผู้ใช้งาน'),
      h('p', { class: 'app-header-user-id' }, `รหัส ${user.student_id}`),
      h('button', {
        type: 'button',
        class: 'app-header-logout',
        onClick: () => onLogout(),
      }, 'ออกจากระบบ'),
    );
    const userButton = h('button', {
      type: 'button',
      class: 'app-header-user',
      'aria-haspopup': 'true',
      'aria-expanded': 'false',
      'aria-controls': 'app-header-user-menu',
      'aria-label': `บัญชีผู้ใช้ ${user.name || user.student_id}`,
      onClick: () => {
        const open = menu.hidden;
        menu.hidden = !open;
        userButton.setAttribute('aria-expanded', String(open));
        userButton.classList.toggle('app-header-user--open', open);
      },
    }, userIcon(), chevron());

    right.append(h('div', { class: 'app-header-user-wrap' }, userButton, menu));
  }

  return h('div', { class: 'app-header-root' },
    h('div', { class: 'app-header-inner' },
      h('a', { class: 'app-header-brand', href: '#/' }, 'Parking'),
      menuButton,
      right,
    ),
  );
}