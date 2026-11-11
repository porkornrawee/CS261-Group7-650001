/**
 * AppFooter — ท้ายเว็บสีแดงเข้ม: แบรนด์ + ปุ่มจอง · เมนู · ลานจอด · ข้อมูลการใช้บริการ · แถบลิขสิทธิ์
 * Owner: Dev 1 | Ticket: LY-02
 * แสดงทุกหน้าผ่าน <footer id="app-footer"> ใน index.html (main.js เป็นคน render)
 */
import { h, s } from '../../core/dom.js';
import { NAV_LINKS } from './AppHeader.js';
import { ZONES } from '../../features/home/zones.js';

function icon(...paths) {
  return s('svg', { class: 'app-footer-icon', viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' },
    ...paths.map((d) => s('path', {
      d, fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    })));
}

const ICONS = {
  clock: () => icon('M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z', 'M12 7.5V12l3 2'),
  pin: () => icon('M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z', 'M12 7a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5z'),
  ticket: () => icon('M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4z', 'M14 7v10'),
  people: () => icon('M9 11a3.5 3.5 0 1 0 0-7a3.5 3.5 0 1 0 0 7z', 'M3 20c.6-3.4 3-5.5 6-5.5s5.4 2.1 6 5.5', 'M16 4.5a3.5 3.5 0 0 1 0 6.5', 'M18 14.8c1.6.7 2.7 2.4 3 5.2'),
  up: () => icon('M12 19V5', 'M6 11l6-6 6 6'),
};

const SERVICE_INFO = [
  ['clock', 'เปิดให้จองทุกวัน 08:00 – 22:00 น.'],
  ['pin', 'มหาวิทยาลัยธรรมศาสตร์ ศูนย์รังสิต จ.ปทุมธานี'],
  ['ticket', 'นักศึกษา / บุคลากร จอดฟรี · บุคคลทั่วไป 10 – 20 ฿/ชม.'],
  ['people', 'พัฒนาโดย CS261 Group 7'],
];

function linkColumn(title, items) {
  return h('nav', { class: 'app-footer-col', 'aria-label': title },
    h('h2', { class: 'app-footer-heading' }, title),
    h('ul', { class: 'app-footer-list' },
      items.map(([href, label]) => h('li', null, h('a', { class: 'app-footer-link', href }, label)))),
  );
}

export function AppFooter() {
  const year = new Date().getFullYear();

  const brand = h('div', { class: 'app-footer-brand' },
    h('a', { class: 'app-footer-logo', href: '#/', 'aria-label': 'Parking หน้าแรก' },
      h('span', { class: 'app-footer-logo-badge', 'aria-hidden': 'true' }, 'P'),
      h('span', { class: 'app-footer-logo-text' }, 'Parking'),
    ),
    h('p', { class: 'app-footer-tagline' }, 'ระบบจองที่จอดรถ มหาวิทยาลัยธรรมศาสตร์ ศูนย์รังสิต'),
    h('p', { class: 'app-footer-desc' }, 'จองช่องจอดล่วงหน้า สแกน QR เข้าจอด ไม่ต้องวนหาที่ว่าง'),
    h('a', { class: 'app-footer-cta', href: '#/booking' }, 'จองที่จอดเลย'),
  );

  const info = h('div', { class: 'app-footer-col' },
    h('h2', { class: 'app-footer-heading' }, 'ข้อมูลการใช้บริการ'),
    h('ul', { class: 'app-footer-list app-footer-info' },
      SERVICE_INFO.map(([name, text]) => h('li', { class: 'app-footer-info-row' }, ICONS[name](), h('span', null, text)))),
  );

  const backToTop = h('button', {
    type: 'button',
    class: 'app-footer-top',
    onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
  }, ICONS.up(), h('span', null, 'กลับขึ้นด้านบน'));

  return h('div', { class: 'app-footer-root' },
    h('div', { class: 'app-footer-inner' },
      h('div', { class: 'app-footer-grid' },
        brand,
        linkColumn('เมนู', NAV_LINKS.map((l) => [l.href, l.label])),
        linkColumn('ลานจอด', ZONES.map((z) => [z.href, z.name])),
        info,
      ),
      h('div', { class: 'app-footer-bottom' },
        h('p', { class: 'app-footer-copy' }, `© ${year} Parking · มหาวิทยาลัยธรรมศาสตร์ ศูนย์รังสิต`),
        backToTop,
      ),
    ),
  );
}
