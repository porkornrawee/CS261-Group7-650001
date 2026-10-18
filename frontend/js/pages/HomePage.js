/**
 * HomePage — หน้าแรก: การ์ดเมนู 3 ใบ (ลงทะเบียนรถ / จองที่จอด / ตรวจบัตรและประวัติ)
 * Owner: Dev 1 | Ticket: PG-01 | Priority: P0 | Route: #/
 * @param { { params: Record<string,string> } } ctx  พารามิเตอร์จาก URL (เช่น ticket → params.code)
 * @returns {HTMLElement}
 * Page เท่านั้นที่คุยกับ js/api/* และ js/store.js ได้ (component ใน ui/ ห้ามรู้จัก api)
 */
/** HomePage — PG-01 | หน้าแรกระบบ SmartPark TU */
import { h } from '../core/dom.js';
import { AppFooter } from '../components/layout/AppFooter.js';

const parkingAreas = [
  {
    group: 'sc',
    badge: 'SC 1',
    name: 'ที่จอดอาคาร SC 1',
    car: 12,
    bike: 20,
    location: 'โซนใต้อาคาร',
    art: 'sc1',
  },
  {
    group: 'sc',
    badge: 'SC 2',
    name: 'ที่จอดอาคาร SC 2',
    car: 8,
    bike: 14,
    location: 'โซนลานข้างอาคาร',
    art: 'sc2',
    warning: true,
  },
  {
    group: 'sc',
    badge: 'SC 3',
    name: 'ที่จอดอาคาร SC 3',
    car: 15,
    bike: 24,
    location: 'โซนใต้อาคาร',
    art: 'sc3',
  },
  {
    group: 'library',
    badge: 'หอสมุด',
    name: 'ที่จอดหอสมุดป๋วย อึ๊งภากรณ์',
    car: 18,
    bike: 30,
    location: 'ใกล้ประตูทางเข้าหลัก',
    art: 'library',
  },
  {
    group: 'full',
    badge: 'ศกร.',
    name: 'ที่จอดศูนย์การเรียนรู้',
    location: 'โซนโถงบริหาร · ใกล้ศูนย์การนักศึกษา',
    art: 'school',
    full: true,
  },
];
/** วาดอาคารด้วย SVG*/
function createBuildingArtwork(type) {
  if (type === 'library') {
    return h('svg', {
      class: 'home-art-svg',
      viewBox: '0 0 220 126',
      'aria-hidden': 'true',
      focusable: 'false',
    },
      h('path', { d: 'M13 39 L110 9 L207 39 Z', fill: 'currentColor' }),
      h('rect', { x: 31, y: 109, width: 158, height: 10, fill: 'currentColor' }),
      h('rect', { x: 31, y: 42, width: 158, height: 8, fill: 'currentColor' }),
      ...[47, 78, 109, 140, 171].map((x) =>
        h('rect', {
          x, y: 48, width: 13, height: 64, rx: 2,
          fill: 'currentColor',
        })
      )
    );
  }
  // ขนาดอาคาร
  const layouts = {
    sc1: { cols: 4, rows: 3 },
    sc2: { cols: 5, rows: 2 },
    sc3: { cols: 3, rows: 3 },
  };
  const { cols, rows } = layouts[type] || layouts.sc1;
  const width = cols === 5 ? 204 : cols === 3 ? 138 : 176;
  const height = rows === 2 ? 86 : 116;
  const x0 = (220 - width) / 2;
  const y0 = 126 - height - 5;
  const padding = 11;
  const gap = 7;
  const windowWidth = (width - padding * 2 - gap * (cols - 1)) / cols;
  const windowHeight = (height - padding * 2 - gap * (rows - 1)) / rows;

  const windows = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      windows.push(h('rect', {
        x: x0 + padding + col * (windowWidth + gap),
        y: y0 + padding + row * (windowHeight + gap),
        width: windowWidth,
        height: windowHeight,
        rx: 3,
        fill: 'var(--bg)',
      }));
    }
  }

  return h('svg', {
    class: 'home-art-svg',
    viewBox: '0 0 220 126',
    'aria-hidden': 'true',
    focusable: 'false',
  },
    h('rect', {
      x: x0, y: y0, width, height, rx: 8,
      fill: 'currentColor',
    }),
    ...windows
  );
}
function createLocationPin() {
  return h('svg', {
    class: 'home-location-pin',
    viewBox: '0 0 24 24',
    width: 18,
    height: 18,
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': 1.8,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
    focusable: 'false',
  },
    h('path', { d: 'M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z' }),
    h('circle', { cx: 12, cy: 10, r: 3 })
  );
}

function createParkingCard(parkingArea) {
  // A full parking area remains clickable so users see a clear prohibition sign.
  let fullButton;
  let fullOverlay;

  const showFullWarning = () => {
    if (!parkingArea.full) return;
    fullOverlay.replaceChildren('🚫', h('span', null, 'ห้ามจอง'));
    fullOverlay.classList.add('home-full-overlay--blocked');
    fullButton.textContent = '🚫 ที่จอดเต็ม · ไม่สามารถจองได้';
    fullButton.setAttribute('aria-label', 'ห้ามจอง ที่จอดเต็มแล้ว');
  };

  const parkingArtwork = h('div', { class: `home-parking-art${parkingArea.full ? ' home-parking-art--full' : ''}` },
    h('span', { class: 'home-parking-badge' }, parkingArea.badge), createBuildingArtwork(parkingArea.art),
    parkingArea.full ? (fullOverlay = h('span', { class: 'home-full-overlay', 'aria-live': 'polite' }, 'ที่จอดเต็ม')) : null);
  const availabilityBadges = parkingArea.full
    ? [h('span', { class: 'home-availability home-availability--full' }, '🚗 รถยนต์/EV เต็ม'),
    h('span', { class: 'home-availability home-availability--full' }, '🏍️ มอเตอร์ไซค์ เต็ม')]
    : [h('span', { class: `home-availability${parkingArea.warning ? ' home-availability--warning' : ''}` }, `🚗 รถยนต์/EV ว่าง ${parkingArea.car}`),
    h('span', { class: 'home-availability' }, `🏍️ มอเตอร์ไซค์ ว่าง ${parkingArea.bike}`)];
  return h('article', { class: `home-parking-card${parkingArea.full ? ' home-parking-card--full' : ''}`, ...(parkingArea.full ? { onClick: showFullWarning } : {}) }, parkingArtwork,
    h('div', { class: 'home-parking-body' }, h('h3', null, parkingArea.name),
      h('div', { class: 'home-availability-list' }, availabilityBadges),
      h('div', { class: 'home-usage-track' }, h('span', { style: `width:${parkingArea.full ? 100 : parkingArea.warning ? 74 : 60}%` })),
      h('p', { class: 'home-location' }, createLocationPin(), h('span', null, parkingArea.location)),
      parkingArea.full ? (fullButton = h('button', { type: 'button', class: 'home-full-action', onClick: showFullWarning }, '🔒 ที่จอดเต็ม · ไม่สามารถจองได้'))
        : h('a', { class: 'home-parking-action', href: '#/booking' }, 'เลือกช่องจอด ›')));
}
function createParkingSection(title, parkingAreas) {
  const track = h('div', { class: 'home-parking-track', tabindex: '0', 'aria-label': title }, parkingAreas.map(createParkingCard));
  const controls = h('div', { class: 'home-scroll-controls' },
    h('button', { type: 'button', 'aria-label': `เลื่อน ${title} ไปทางซ้าย`, onClick: () => track.scrollBy({ left: -380, behavior: 'smooth' }) }, '❮'),
    h('button', { type: 'button', 'aria-label': `เลื่อน ${title} ไปทางขวา`, onClick: () => track.scrollBy({ left: 380, behavior: 'smooth' }) }, '❯'));
  return h('section', { class: 'home-section' },
    h('div', { class: 'home-section-heading' },
      h('div', null, h('h2', null, title), h('p', null, 'เลื่อนดูด้านข้างได้')), controls), track);
}
export function HomePage() {
  return h('div', { class: 'home-root' },
    h('div', { class: 'home-container' },
      h('section', { class: 'home-hero' },
        h('strong', null, 'SmartPark TU'),
        h('h1', null, 'ค้นหาที่จอดรถที่เหมาะกับคุณ'),
        h('p', null, 'เลือกพื้นที่จอด ดูช่องว่าง และจองได้ในไม่กี่ขั้นตอน')),
      createParkingSection('กลุ่มอาคารเรียนรวม SC 1–3', parkingAreas.filter((item) => item.group === 'sc')),
      createParkingSection('หอสมุดป๋วย อึ๊งภากรณ์', parkingAreas.filter((item) => item.group === 'library')),
      createParkingSection('ลานจอดเต็มแล้ว', parkingAreas.filter((item) => item.group === 'full')),
      h('section', { class: 'home-shortcuts' }, h('h2', null, 'เมนูใช้งาน'),
        h('div', { class: 'home-shortcut-grid' },
          ...[['ลงทะเบียนรถ', 'ตรวจสอบนักศึกษาและบันทึกทะเบียนรถ', '#/vehicle'],
          ['จองที่จอด', 'เลือกวัน เวลา และช่องจอด', '#/booking'],
          ['ตรวจบัตรและประวัติ', 'ดูรายการจองย้อนหลัง', '#/history']]
            .map(([title, hint, url]) => h('a', { class: 'home-shortcut', href: url },
              h('strong', null, title), h('span', null, hint), h('span', null, '→'))))),
    ), AppFooter());
}
