/**
 * HomePage — หน้าแรก: ฮีโร่ + การ์ดลานจอด SC 1-3, หอสมุดป๋วย, ศกร. + ทางลัด
 */
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

function createSvgElement(tag, attributes = {}, ...children) {
  const svgNamespace = 'http://www.w3.org/2000/svg';
  const element = document.createElementNS(svgNamespace, tag);
  for (const [attributeName, value] of Object.entries(attributes)) {
    if (value === null || value === undefined) continue;
    element.setAttribute(attributeName, String(value));
  }
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    element.append(
      child instanceof Node ? child : document.createTextNode(String(child))
    );
  }
  return element;
}

/** สร้างรูปอาคารด้วย SVG */
function createBuildingArtwork(buildingType) {
  if (buildingType === 'library') {
    return createSvgElement(
      'svg',
      {
        class: 'home-art-svg',
        viewBox: '0 0 220 126',
        'aria-hidden': 'true',
        focusable: 'false',
      },
      createSvgElement('path', {
        d: 'M13 39 L110 9 L207 39 Z',
        fill: 'currentColor',
      }),
      createSvgElement('rect', {
        x: 31,
        y: 109,
        width: 158,
        height: 10,
        fill: 'currentColor',
      }),
      createSvgElement('rect', {
        x: 31,
        y: 42,
        width: 158,
        height: 8,
        fill: 'currentColor',
      }),
      ...[47, 78, 109, 140, 171].map((positionX) =>
        createSvgElement('rect', {
          x: positionX,
          y: 48,
          width: 13,
          height: 64,
          rx: 2,
          fill: 'currentColor',
        })
      )
    );
  }
  const buildingLayouts = {
    sc1: { columns: 4, rows: 3 },
    sc2: { columns: 5, rows: 2 },
    sc3: { columns: 3, rows: 3 },
    school: { columns: 4, rows: 3 },
  };
  const { columns, rows } = buildingLayouts[buildingType] || buildingLayouts.sc1;
  const buildingWidth = columns === 5 ? 204 : columns === 3 ? 138 : 176;
  const buildingHeight = rows === 2 ? 86 : 116;
  const buildingX = (220 - buildingWidth) / 2;
  const buildingY = 126 - buildingHeight - 5;
  const padding = 11;
  const windowGap = 7;
  const windowWidth = (buildingWidth - padding * 2 - windowGap * (columns - 1)) / columns;
  const windowHeight = (buildingHeight - padding * 2 - windowGap * (rows - 1)) / rows;
  const windows = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const windowX = buildingX + padding + column * (windowWidth + windowGap);
      const windowY = buildingY + padding + row * (windowHeight + windowGap);
      windows.push(
        createSvgElement('rect', {
          x: windowX,
          y: windowY,
          width: windowWidth,
          height: windowHeight,
          rx: 3,
          fill: 'var(--surface)',
        })
      );
    }
  }
  return createSvgElement(
    'svg',
    {
      class: 'home-art-svg',
      viewBox: '0 0 220 126',
      'aria-hidden': 'true',
      focusable: 'false',
    },
    createSvgElement('rect', {
      x: buildingX,
      y: buildingY,
      width: buildingWidth,
      height: buildingHeight,
      rx: 8,
      fill: 'currentColor',
    }),
    ...windows
  );
}

/** SVG map pin */
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
  let fullButton;
  let fullOverlay;

  const showFullWarning = () => {
    if (!parkingArea.full) return;
    fullOverlay.replaceChildren('🚫', h('span', null, 'ที่จอดเต็ม'));
    fullOverlay.classList.add('home-full-overlay--blocked');
    fullButton.textContent = 'ที่จอดเต็ม - ไม่สามารถจองได้';
    fullButton.setAttribute('aria-label', 'ที่จอดเต็ม ไม่สามารถจองได้');
  };

  const parkingArtwork = h('div', { class: `home-parking-art${parkingArea.full ? ' home-parking-art--full' : ''}` },
    h('span', { class: 'home-parking-badge' }, parkingArea.badge),
    createBuildingArtwork(parkingArea.art),
    parkingArea.full ? (fullOverlay = h('span', { class: 'home-full-overlay', 'aria-live': 'polite' }, 'ที่จอดเต็ม')) : null
  );

  const availabilityBadges = parkingArea.full
    ? [
        h('span', { class: 'home-availability home-availability--full' }, '🚗 รถยนต์/EV: ที่จอดเต็ม'),
        h('span', { class: 'home-availability home-availability--full' }, '🏍️ มอเตอร์ไซค์: ที่จอดเต็ม')
      ]
    : [
        h('span', { class: `home-availability${parkingArea.warning ? ' home-availability--warning' : ''}` }, `🚗 รถยนต์/EV: ว่าง ${parkingArea.car} ช่อง`),
        h('span', { class: 'home-availability' }, `🏍️ มอเตอร์ไซค์: ว่าง ${parkingArea.bike} ช่อง`)
      ];

  return h('article', {
    class: `home-parking-card${parkingArea.full ? ' home-parking-card--full' : ''}`,
    ...(parkingArea.full ? { onClick: showFullWarning } : {})
  },
    parkingArtwork,
    h('div', { class: 'home-parking-body' },
      h('h3', null, parkingArea.name),
      h('div', { class: 'home-availability-list' }, availabilityBadges),
      h('div', { class: 'home-usage-track' }, h('span', { style: `width:${parkingArea.full ? 100 : parkingArea.warning ? 74 : 50}%` })),
      h('p', { class: 'home-location' }, createLocationPin(), h('span', null, parkingArea.location)),
      parkingArea.full
        ? (fullButton = h('button', { type: 'button', class: 'home-full-action', onClick: showFullWarning }, 'ที่จอดเต็ม - ไม่สามารถจองได้'))
        : h('a', { class: 'home-parking-action', href: '#/booking' }, 'เลือกช่องจอด')
    )
  );
}

function createParkingSection(sectionTitle, parkingList) {
  const canScroll = parkingList.length > 1;
  const parkingTrack = h('div', {
    class: `home-parking-track${canScroll ? '' : ' home-parking-track--static'}`,
    ...(canScroll ? { tabindex: '0', 'aria-label': sectionTitle } : {}),
  }, ...parkingList.map(createParkingCard));

  const scrollControls = canScroll
    ? h('div', { class: 'home-scroll-controls' },
        h('button', {
          type: 'button',
          'aria-label': `เลื่อน ${sectionTitle} ไปทางซ้าย`,
          onClick: () => parkingTrack.scrollBy({ left: -380, behavior: 'smooth' }),
        }, '❮'),
        h('button', {
          type: 'button',
          'aria-label': `เลื่อน ${sectionTitle} ไปทางขวา`,
          onClick: () => parkingTrack.scrollBy({ left: 380, behavior: 'smooth' }),
        }, '❯'))
    : null;

  return h('section', { class: 'home-section' },
    h('div', { class: 'home-section-heading' },
      h('div', null,
        h('h2', null, sectionTitle),
        canScroll ? h('p', null, 'เลื่อนดูด้านข้างได้') : null
      ),
      scrollControls
    ),
    parkingTrack
  );
}

export function HomePage() {
  return h('div', { class: 'home-root' },
    h('div', { class: 'home-container' },
      h('section', { class: 'home-hero' },
        h('strong', null, 'SmartPark TU'),
        h('h1', null, 'จองที่จอดรถในมหาวิทยาลัย ง่ายและมั่นใจก่อนถึงอาคาร'),
        h('p', null, 'เลือกพื้นที่จอด ตรวจสอบช่องว่างแบบ Real-time และสำรองช่องจอดล่วงหน้าได้ทันที')
      ),
      createParkingSection('กลุ่มอาคารเรียนรวม SC 1–3', parkingAreas.filter((item) => item.group === 'sc')),
      createParkingSection('หอสมุดป๋วย อึ๊งภากรณ์', parkingAreas.filter((item) => item.group === 'library')),
      createParkingSection('ลานจอดที่เต็มขณะนี้', parkingAreas.filter((item) => item.group === 'full')),
      h('section', { class: 'home-shortcuts' },
        h('h2', null, 'เมนูใช้งานด่วน'),
        h('div', { class: 'home-shortcut-grid' },
          ...[['ลงทะเบียนรถ', 'ตรวจสอบสิทธิ์นักศึกษาและผูกทะเบียนรถ', '#/vehicle'],
             ['จองที่จอด', 'เลือกวัน เวลา ช่องจอด และประเภทรถ', '#/booking'],
             ['ประวัติและการจองของฉัน', 'ดูบัตรจอง QR Code และประวัติย้อนหลัง', '#/history']]
            .map(([title, hint, url]) => h('a', { class: 'home-shortcut', href: url },
              h('strong', null, title),
              h('span', null, hint),
              h('span', null, '→')
            ))
        )
      )
    ),
    AppFooter()
  );
}
