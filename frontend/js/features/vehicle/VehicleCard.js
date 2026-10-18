/**
 * VehicleCard — การ์ดแสดงข้อมูลรถที่บันทึกแล้ว
 * Owner: Dev 2 | Ticket: VH-03 | Priority: P1
 * @param { {vehicle:{id:number,plate:string,province:string,studentId:string}} } props
 * @returns {HTMLElement}
 * Done when: แสดงทะเบียนแบบป้ายรถ อ่านง่าย
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .vehicle-card- ใน VehicleCard.css)
 */
import { h } from '../../core/dom.js';
export function VehicleCard({ vehicle = {} } = {}) {
  return h('article', { class: 'vehicle-card-root' },
    h('h2', null, 'ลงทะเบียนรถสำเร็จ'),
    h('div', { class: 'vehicle-card-plate' }, h('strong', null, vehicle.plate || '—'),
      h('span', null, vehicle.province || '')),
    h('p', null, `รหัสนักศึกษา: ${vehicle.studentId || vehicle.student_id || '—'}`));
}
