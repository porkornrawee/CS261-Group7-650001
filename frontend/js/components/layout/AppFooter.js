/**
 * AppFooter — ท้ายเว็บ ข้อมูลโครงการ/ปีการศึกษา
 * Owner: Dev 1 | Ticket: LY-02 | Priority: P2 (ข้ามได้ ไม่ต้องทำรอบ Demo)
 * @param { {} } props
 * @returns {HTMLElement}
 * Done when: เรียบง่าย ไม่ชนเนื้อหาบนมือถือ
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .app-footer- ใน AppFooter.css)
 */
import {h} from '../../core/dom.js';
export function AppFooter(props={}){
  const root=h('div',{class:'app-footer-root'}),inner=h('div',{class:'app-footer-inner'});
  inner.append(h('div',{class:'app-footer-brand'},h('span',{class:'app-footer-logo'},'P'),h('strong',null,'SmartPark ',h('span',null,'TU'))),h('p',{class:'app-footer-description'},'ระบบจองที่จอดรถ มหาวิทยาลัยธรรมศาสตร์'),h('h2',{class:'app-footer-heading'},'ติดต่อเจ้าหน้าที่'),h('p',null,'มีปัญหาในการจองหรืออยากสอบถาม ติดต่อเราได้ทุกวัน 06:00–22:00 น.'));
  const contacts=h('div',{class:'app-footer-contacts'});
  for(const [label,value] of [['โทรศัพท์','02-123-4567'],['LINE Official','@smartparktu'],['อีเมล','smartpark@example.com']])contacts.append(h('div',{class:'app-footer-contact-item'},h('span',{class:'app-footer-contact-label'},label),h('strong',{class:'app-footer-contact-value'},value)));
  inner.append(contacts,h('p',{class:'app-footer-disclaimer'}));
  root.append(inner);
  return root;
}
