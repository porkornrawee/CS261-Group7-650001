/**
 * router.js — hash router + route guard (Owner: Dev 1 | Ticket: CO-05, US11)
 * เพิ่มหน้าใหม่ = เพิ่ม 1 บรรทัดใน ROUTES (ใช้ :param สำหรับตัวแปรใน URL)
 *   auth: true  = ต้องล็อกอินก่อน ถ้า /api/auth/me ได้ 401 จะเด้งไป #/login?next=<หน้าเดิม> (TC-US11-03, NFR03)
 *   guestOnly   = หน้าสำหรับคนยังไม่ล็อกอิน (ล็อกอินแล้วจะเด้งกลับหน้าหลัก)
 * ตัวอย่าง #/ticket/PK-ABCD2345 -> TicketPage({ params: { code: 'PK-ABCD2345' } })
 */
import { HomePage } from './pages/HomePage.js';
import { LoginPage } from './pages/LoginPage.js';
import { VehiclePage } from './pages/VehiclePage.js';
import { BookingPage } from './pages/BookingPage.js';
import { TicketPage } from './pages/TicketPage.js';
import { HistoryPage } from './pages/HistoryPage.js';
import { h } from './core/dom.js';
import { getState } from './store.js';
import { ensureSession, loginRedirect, nextFromHash } from './features/auth/session.js';
import { MemberRegisterPage } from './pages/MemberRegisterPage.js';

export const ROUTES = [
  { path: '/', page: HomePage },
  { path: '/login', page: LoginPage, guestOnly: true },
  { path: '/register', page: MemberRegisterPage, guestOnly: true },
  { path: '/vehicle', page: VehiclePage, auth: true },
  { path: '/booking', page: BookingPage, auth: true },
  { path: '/ticket/:code', page: TicketPage, auth: true },
  { path: '/history', page: HistoryPage, auth: true },
];

export function match(pattern, path) {
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

/**
 * ตัดสินว่าต้อง redirect ไปไหน (ฟังก์ชันบริสุทธิ์ ใช้ทดสอบได้)
 * @returns {string|null} hash ปลายทาง หรือ null = แสดงหน้านี้ได้เลย
 */
export function guardRedirect(route, path, user) {
  if (route.auth && !user) return loginRedirect(path);
  if (route.guestOnly && user) return `#${nextFromHash()}`;
  return null;
}

export function currentPath() {
  return (window.location.hash.replace(/^#/, '') || '/').split('?')[0];
}

export function startRouter(outlet) {
  let renderId = 0;

  async function render() {
    const id = ++renderId;
    const path = currentPath();
    for (const route of ROUTES) {
      const params = match(route.path, path);
      if (!params) continue;

      if ((route.auth || route.guestOnly) && !getState().authChecked) {
        outlet.replaceChildren(h('p', { class: 'router-loading', role: 'status' }, 'กำลังตรวจสอบการเข้าสู่ระบบ…'));
        await ensureSession();
        if (id !== renderId) return; // ผู้ใช้เปลี่ยนหน้าระหว่างรอ
      }

      const redirect = guardRedirect(route, path, getState().user);
      if (redirect) {
        window.location.replace(redirect);
        return;
      }
      outlet.replaceChildren(route.page({ params }));
      window.scrollTo(0, 0);
      return;
    }
    outlet.replaceChildren(h('p', null, 'ไม่พบหน้านี้ ', h('a', { href: '#/' }, 'กลับหน้าแรก')));
  }

  window.addEventListener('hashchange', render);
  render();
  return render;
}