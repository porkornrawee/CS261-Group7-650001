/**
 * Icon — ไอคอน SVG แบบเส้น (stroke) ชุดเดียวทั้งเว็บ แทนอิโมจิ/อักขระพิเศษ
 * ใช้ currentColor จึงเปลี่ยนสีตามข้อความรอบข้างและรองรับธีมได้
 * @param {string} name   ชื่อไอคอน ดู ICON_NAMES
 * @param {{size?:number, class?:string, label?:string}} [options]
 *   - ไม่ใส่ label → ซ่อนจากโปรแกรมอ่านหน้าจอ (aria-hidden)
 *   - ใส่ label  → role="img" + aria-label
 */
import { s } from '../../core/dom.js';

const circle = (cx, cy, r) => ['circle', { cx, cy, r }];
const path = (d) => ['path', { d }];

const SHAPES = {
  bell: [path('M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9'), path('M10.3 21a1.94 1.94 0 0 0 3.4 0')],
  clock: [circle(12, 12, 10), path('M12 6v6l4 2')],
  hourglass: [
    path('M5 22h14'), path('M5 2h14'),
    path('M17 22v-4.17a2 2 0 0 0-.59-1.41L12 12l-4.41 4.42A2 2 0 0 0 7 17.83V22'),
    path('M7 2v4.17a2 2 0 0 0 .59 1.41L12 12l4.41-4.42A2 2 0 0 0 17 6.17V2'),
  ],
  'x-circle': [circle(12, 12, 10), path('m15 9-6 6'), path('m9 9 6 6')],
  check: [path('M20 6 9 17l-5-5')],
  'check-all': [path('M18 6 7 17l-5-5'), path('m22 10-7.5 7.5L13 16')],
  car: [
    path('M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2'),
    circle(7, 17, 2), path('M9 17h6'), circle(17, 17, 2),
  ],
  motorcycle: [circle(5.5, 17, 3), circle(18.5, 17, 3), path('M8.5 17h5l3.5-7h-4'), path('M14 10l-1-3h-2.5'), path('M16 7h2.5')],
  bolt: [path('M13 2 3 14h9l-1 8 10-12h-9z')],
  sun: [
    circle(12, 12, 4), path('M12 2v2'), path('M12 20v2'), path('m4.93 4.93 1.41 1.41'), path('m17.66 17.66 1.41 1.41'),
    path('M2 12h2'), path('M20 12h2'), path('m6.34 17.66-1.41 1.41'), path('m19.07 4.93-1.41 1.41'),
  ],
  'cloud-sun': [
    path('M12 2v2'), path('m4.93 4.93 1.41 1.41'), path('M20 12h2'), path('m19.07 4.93-1.41 1.41'),
    path('M15.95 12.65a4 4 0 0 0-5.93-4.13'), path('M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z'),
  ],
  pencil: [path('M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z')],
  'alert-triangle': [
    path('m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3'), path('M12 9v4'), path('M12 17h.01'),
  ],
  'arrow-right': [path('M5 12h14'), path('m12 5 7 7-7 7')],
  menu: [path('M4 6h16'), path('M4 12h16'), path('M4 18h16')],
  info: [circle(12, 12, 10), path('M12 16v-4'), path('M12 8h.01')],
  'map-pin': [path('M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z'), circle(12, 10, 3)],
  'bell-off': [path('M8.7 3A6 6 0 0 1 18 8c0 2.7.4 4.6.9 6'), path('M17 17H3s3-2 3-9c0-.7.1-1.4.3-2'), path('M10.3 21a1.94 1.94 0 0 0 3.4 0'), path('m2 2 20 20')],
};

export const ICON_NAMES = Object.keys(SHAPES);

export function Icon(name, { size = 20, class: className = '', label } = {}) {
  const shapes = SHAPES[name] || SHAPES.info;
  const props = {
    class: `icon${className ? ` ${className}` : ''}`,
    viewBox: '0 0 24 24',
    width: size,
    height: size,
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': 2,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    focusable: 'false',
    ...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': 'true' }),
  };
  return s('svg', props, ...shapes.map(([tag, attrs]) => s(tag, attrs)));
}
