/**
 * PageShell — โครงหน้ามาตรฐาน: หัวข้อหน้า + พื้นที่เนื้อหา (ทุก Page ใช้ตัวนี้ห่อ)
 * Owner: Dev 1 | Ticket: LY-03 | Priority: P0
 * @param { {title:string, subtitle?:string, children:Node|Node[]} } props
 * @returns {HTMLElement}
 * Done when: ทุกหน้ามีระยะขอบ/ความกว้างสูงสุดเหมือนกัน
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .page-shell- ใน PageShell.css)
 */
import { h } from '../../core/dom.js';
export function PageShell({ title, subtitle = '', children = [] } = {}) {
  return h('section', { class: 'page-shell-root' },
    h('header', { class: 'page-shell-heading' },
      h('p', { class: 'page-shell-eyebrow' }, 'SmartPark TU'),
      title ? h('h1', { class: 'page-shell-title' }, title) : null,
      subtitle ? h('p', { class: 'page-shell-subtitle' }, subtitle) : null,
    ),
    h('div', { class: 'page-shell-content' }, children),
  );
}
