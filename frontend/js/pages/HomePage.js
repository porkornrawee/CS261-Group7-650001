/**
 * HomePage — หน้าแรก: รูปลานจอดแบ่งตามโซน (Figma: "Computer Home" / "Computer HomeLogin")
 * Owner: Dev 1 | Ticket: PG-01 | Route: #/
 * กดรูปลานจอด → ไปหน้าจองของลานนั้น (ถ้ายังไม่ล็อกอิน router จะพาไปหน้า login ก่อน)
 */
import { h, s } from '../core/dom.js';
import { ZONES, ZONE_GROUPS, zoneImage } from '../features/home/zones.js';

function fallbackArt() {
  return s('svg', { class: 'home-zone-fallback', viewBox: '0 0 120 60', 'aria-hidden': 'true', focusable: 'false' },
    s('rect', { x: 30, y: 14, width: 60, height: 40, rx: 3, fill: 'currentColor' }),
    ...[0, 1, 2].flatMap((row) => [0, 1, 2, 3].map((col) => s('rect', {
      x: 36 + col * 13, y: 20 + row * 11, width: 9, height: 7, rx: 1, fill: 'var(--primary-50)',
    }))));
}

function zoneCard(zone, size) {
  const photo = h('img', {
    class: 'home-zone-photo',
    src: zoneImage(zone.id),
    alt: '',
    loading: 'lazy',
    onError: () => {
      photo.replaceWith(fallbackArt());
      card.classList.add('home-zone-card--fallback');
    },
  });
  const card = h('a', {
    class: `home-zone-card home-zone-card--${size}`,
    href: zone.href,
    'aria-label': `จองที่จอด ${zone.name}`,
  },
    photo,
    h('span', { class: 'home-zone-caption' }, zone.name),
  );
  return card;
}

export function HomePage() {
  return h('div', { class: 'home-root' },
    h('h1', { class: 'home-sr-only' }, 'เลือกลานจอดรถ'),
    ZONE_GROUPS.map((group) => {
      const zones = ZONES.filter((z) => z.group === group.id).sort((a, b) => a.homeOrder - b.homeOrder);
      const size = zones.length >= 3 ? 'small' : 'large';
      return h('section', { class: 'home-section', 'aria-labelledby': `home-${group.id}` },
        h('h2', { class: 'home-section-title', id: `home-${group.id}` }, group.title),
        h('div', { class: `home-zone-grid home-zone-grid--${size}` }, zones.map((z) => zoneCard(z, size))),
      );
    }),
  );
}