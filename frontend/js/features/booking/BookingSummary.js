/**
 * BookingSummary — สรุปก่อนยืนยัน (วัน เวลา ช่อง ทะเบียนรถ) + ปุ่มยืนยัน
 * Owner: Dev 3 | Ticket: BK-07 | Priority: P0
 * @param { {summary:{date:string,start:string,end:string,slotLabel?:string,zoneName?:string,plate?:string}, busy?:boolean, onConfirm:()=>void} } props
 * @returns {HTMLElement}
 * Done when: ปุ่มยืนยันปิดจนกว่าจะเลือกช่องครบ
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .booking-summary- ใน BookingSummary.css)
 */
import { todo } from '../../core/dom.js';

import { h } from '../../core/dom.js';

export function BookingSummary(props = {}) {
  const { summary = {}, busy = false, onConfirm } = props;
  const { date = '-', start = '-', end = '-', slotLabel = 'ยังไม่เลือก', zoneName = '-', plate = '-' } = summary;
  const isReady = slotLabel !== 'ยังไม่เลือก' && slotLabel != null;

  return h('div', { class: 'booking-summary' },
    h('div', { class: 'booking-summary__content' },
      h('h3', { class: 'booking-summary__title' }, 'สรุปข้อมูลการจอง'),
      h('div', { class: 'booking-summary__row' }, h('span', {}, 'วันที่:'), h('strong', {}, date)),
      h('div', { class: 'booking-summary__row' }, h('span', {}, 'เวลา:'), h('strong', {}, `${start} - ${end} น.`)),
      h('div', { class: 'booking-summary__row' }, h('span', {}, 'โซน / ช่อง:'), h('strong', {}, `${zoneName} / ${slotLabel}`)),
      h('div', { class: 'booking-summary__row' }, h('span', {}, 'ทะเบียนรถ:'), h('strong', {}, plate))
    ),
    h('button', {
      class: 'btn btn--primary booking-summary__btn',
      type: 'button',
      disabled: !isReady || busy,
      onClick: onConfirm
    }, busy ? 'กำลังบันทึกการจอง...' : 'ยืนยันการจอง')
  );
}
