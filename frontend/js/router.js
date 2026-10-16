/**
 * router.js — hash router (Owner: Dev 1 | Ticket: CO-05)
 * เพิ่มหน้าใหม่ = เพิ่ม 1 บรรทัดใน ROUTES (ใช้ :param สำหรับตัวแปรใน URL)
 * ตัวอย่าง #/ticket/PK-ABCD2345 -> TicketPage({ params: { code: 'PK-ABCD2345' } })
 */
import { HomePage } from './pages/HomePage.js';
import { VehiclePage } from './pages/VehiclePage.js';
import { BookingPage } from './pages/BookingPage.js';
import { TicketPage } from './pages/TicketPage.js';
import { HistoryPage } from './pages/HistoryPage.js';
import { h } from './core/dom.js';

const ROUTES = [
  { path: '/', page: HomePage },
  { path: '/vehicle', page: VehiclePage },
  { path: '/booking', page: BookingPage },
  { path: '/ticket/:code', page: TicketPage },
  { path: '/history', page: HistoryPage },
];

function match(pattern, path) {
  const a = pattern.split('/').filter(Boolean);
  const b = path.split('/').filter(Boolean);
  if (a.length !== b.length) return null;
  const params = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(':')) params[a[i].slice(1)] = decodeURIComponent(b[i]);
    else if (a[i] !== b[i]) return null;
  }
  return params;
}

export function currentPath() {
  return (window.location.hash.replace(/^#/, '') || '/').split('?')[0];
}

export function startRouter(outlet) {
  function render() {
    const path = currentPath();
    for (const route of ROUTES) {
      const params = match(route.path, path);
      if (params) {
        outlet.replaceChildren(route.page({ params }));
        window.scrollTo(0, 0);
        return;
      }
    }
    outlet.replaceChildren(h('p', null, 'ไม่พบหน้านี้ ', h('a', { href: '#/' }, 'กลับหน้าแรก')));
  }
  window.addEventListener('hashchange', render);
  render();
}
