/**
 * LoginShowcase — ผังลานจอดย่อบนหน้า login ใช้ข้อมูลจริงจาก /api/zones + /api/availability
 * (พรุ่งนี้ 09:00–10:00 เหมือนค่าเริ่มต้นหน้าจอง) ถ้าโหลดไม่ได้จะแสดงผังว่างโดยไม่มีตัวเลข
 * @returns {HTMLElement}
 */
import { h } from '../../core/dom.js';
import { getLayout, getAvailability } from '../../api/zones.js';

const pad = (n) => String(n).padStart(2, '0');

function tomorrowIso() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function Car() {
  return h('span', { class: 'lot-mini__car', 'aria-hidden': 'true' });
}

function Row(zone, statusById) {
  const bays = zone.slots.map((slot) => {
    const taken = statusById.get(slot.id) === 'booked';
    return h('li', { class: `lot-mini__bay${taken ? ' lot-mini__bay--taken' : ''}` },
      taken ? Car() : null,
      h('span', { class: 'lot-mini__label' }, slot.label),
      h('span', { class: 'sr-only' }, taken ? ' จองแล้ว' : ' ว่าง'));
  });
  const free = zone.slots.filter((slot) => statusById.get(slot.id) !== 'booked').length;
  return h('div', { class: 'lot-mini__zone' },
    h('div', { class: 'lot-mini__zone-head' },
      h('strong', null, zone.name),
      statusById.size ? h('span', null, `ว่าง ${free} จาก ${zone.slots.length} ช่อง`) : null),
    h('ul', { class: 'lot-mini__bays' }, bays));
}

export function LoginShowcase() {
  const date = tomorrowIso();
  const stage = h('div', { class: 'lot-mini__stage' }, h('p', { class: 'lot-mini__loading' }, 'กำลังโหลดผังลานจอด…'));

  (async () => {
    let layout;
    const status = new Map();
    try {
      layout = await getLayout();
      const avail = await getAvailability({ date, start: '09:00', end: '10:00' });
      for (const slot of avail.slots || []) status.set(slot.id, slot.status);
    } catch (_) {
      if (!layout) { stage.replaceChildren(); return; }
    }
    stage.replaceChildren(h('div', { class: 'lot-mini__road', 'aria-hidden': 'true' }),
      ...layout.zones.map((zone) => Row(zone, status)));
    // ทางวิ่งอยู่ระหว่างสองโซน
    const road = stage.querySelector('.lot-mini__road');
    if (stage.children.length > 2) stage.insertBefore(road, stage.children[2]);
  })();

  return h('figure', { class: 'lot-mini' },
    stage,
    h('figcaption', { class: 'lot-mini__caption' },
      h('span', { class: 'lot-mini__key' }, h('i', { class: 'lot-mini__swatch' }), 'ว่าง'),
      h('span', { class: 'lot-mini__key' }, h('i', { class: 'lot-mini__swatch lot-mini__swatch--taken' }), 'จองแล้ว'),
      h('span', { class: 'lot-mini__when' }, 'พรุ่งนี้ 09:00–10:00')));
}
