/**
 * VehicleForm — ฟอร์มกรอกรหัสนักศึกษา, อีเมล มธ., ทะเบียนรถ, จังหวัด
 * Owner: Dev 2 | Ticket: VH-01 | Priority: P0
 * @param { {initial?:{studentId:string,email:string,plate:string,province:string}, busy?:boolean, errors?:Record<string,string>, onSubmit:(data:{studentId:string,email:string,plate:string,province:string})=>void} } props
 * @returns {HTMLElement}
 * Done when: validate รหัส นศ. 10 หลัก, อีเมลลงท้าย @dome.tu.ac.th, ทะเบียนรูปแบบไทย; ปุ่มกดซ้ำไม่ได้ขณะ busy
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .vehicle-form- ใน VehicleForm.css)
 */
import { todo } from '../../core/dom.js';

export function VehicleForm(props = {}) {
  // TODO(Dev 2): แทนที่ด้วย implementation จริง (ลบ todo() ทิ้ง)
  return todo('VehicleForm', 2, 'VH-01');
}
