/**
 * AppFooter — ท้ายเว็บสีแดง (Figma: footer ทุกหน้า)
 * Owner: Dev 1 | Ticket: LY-02
 * แสดงทุกหน้าผ่าน <footer id="app-footer"> ใน index.html (main.js เป็นคน render)
 */
import { h, s } from '../../core/dom.js';
import { NAV_LINKS } from './AppHeader.js';
import { ZONES } from '../../features/home/zones.js';

function arrow() {
  return s('svg', { class: 'app-footer-arrow', viewBox: '0 0 16 16', 'aria-hidden': 'true', focusable: 'false' },
    s('path', { d: 'M2 8h11M9 4l4 4-4 4', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
}

function clockIcon() {
  return s('svg', { class: 'app-footer-icon', viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' },
    s('circle', { cx: 12, cy: 12, r: 9.5, fill: 'none', stroke: 'currentColor', 'stroke-width': 2.4 }),
    s('path', { d: 'M12 7v5.5l3.5 2', fill: 'none', stroke: 'currentColor', 'stroke-width': 2.4, 'stroke-linecap': 'round' }));
}

function personIcon() {
  return s('svg', { class: 'app-footer-icon', viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' },
    s('circle', { cx: 12, cy: 7.5, r: 4, fill: 'none', stroke: 'currentColor', 'stroke-width': 2.2 }),
    s('path', { d: 'M4 21c.8-4.2 4-6.5 8-6.5s7.2 2.3 8 6.5z', fill: 'none', stroke: 'currentColor', 'stroke-width': 2.2, 'stroke-linejoin': 'round' }));
}

function linkList(title, items) {
  return h('nav', { class: 'app-footer-col', 'aria-label': title },
    h('h2', { class: 'app-footer-col-title' }, title),
    h('ul', { class: 'app-footer-list' },
      items.map(([href, label]) => h('li', null, h('a', { class: 'app-footer-link', href }, arrow(), h('span', null, label))))),
  );
}

export function AppFooter() {
  const year = new Date().getFullYear();
  return h('div', { class: 'app-footer-root' },
    h('div', { class: 'app-footer-inner' },
      h('p', { class: 'app-footer-title', 'aria-hidden': 'true' }, h('span', null, 'Parking')),
      h('div', { class: 'app-footer-grid' },
        h('p', { class: 'app-footer-brand' }, 'จองที่จอดรถ', h('br'), 'มหาวิทยาลัยธรรมศาสตร์', h('br'), 'ศูนย์รังสิต'),
        linkList('เมนู', NAV_LINKS.map((l) => [l.href, l.label])),
        linkList('โซนจอด', ZONES.map((z) => [z.href, z.name])),
        h('div', { class: 'app-footer-col app-footer-info' },
          h('p', { class: 'app-footer-info-row' }, clockIcon(), h('span', null, 'เปิดทุกวัน 08.00 - 22.00 น.')),
          h('p', { class: 'app-footer-info-row' }, personIcon(), h('span', null, 'CS261 group 7')),
        ),
      ),
      h('p', { class: 'app-footer-copy' }, `© ${year} Parking สงวนลิขสิทธิ์`),
    ),
  );
}