/**
 * HomePage — หน้าแรก: การ์ดเมนู 3 ใบ (ลงทะเบียนรถ / จองที่จอด / ตรวจบัตรและประวัติ)
 * Owner: Dev 1 | Ticket: PG-01 | Priority: P0 | Route: #/
 * @param { { params: Record<string,string> } } ctx  พารามิเตอร์จาก URL (เช่น ticket → params.code)
 * @returns {HTMLElement}
 * Page เท่านั้นที่คุยกับ js/api/* และ js/store.js ได้ (component ใน ui/ ห้ามรู้จัก api)
 */
import { todo } from '../core/dom.js';

import { h } from '../core/dom.js';
import { PageShell } from '../components/layout/PageShell.js';
const locations = [
{ id:'SC1', group:'กลุ่มอาคารเรียนรวม SC 1-3', name:'ที่จอดอาคาร SC 1', code:'SC 1', car:12, bike:20, location:'โซนใต้อาคาร', art:'school' },
{ id:'SC2', group:'กลุ่มอาคารเรียนรวม SC 1-3', name:'ที่จอดอาคาร SC 2', code:'SC 2', car:8, bike:14, location:'โซนลานข้างอาคาร', art:'wide' },
{ id:'SC3', group:'กลุ่มอาคารเรียนรวม SC 1-gi3', name:'ที่จอดอาคาร SC 3', code:'SC 3', car:15, bike:24, location:'โซนใต้อาคาร', art:'tower' },
{ id:'LIB', group:'หอสมุดป๋วย อึ๊งภากรณ์', name:'ที่จอดหอสมุดป๋วย อึ๊งภากรณ์', code:'หอสมุด', car:18, bike:30, location:'ใกล้ประตูทางเข้าหลัก', art:'library' },
{ id:'DOME', group:'ลานจอดเต็มแล้ว', name:'ที่จอดศูนย์การเรียนรู้', code:'ศกร.', car:0, bike:0, location:'โซนโดมบริหาร · ใกล้จุดบริการนักศึกษา', art:'school', full:true },
];

function building(type) {
  const figure=h('div',{class:`home-building home-building-${type}`,'aria-hidden':'true'});
  const wall=h('div',{class:'home-building-wall'});
  const count=type==='wide'?10:type==='tower'?9:type==='library'?6:12;
  for(let i=0;i<count;i++)wall.append(h('span',{class:'home-window'}));
  figure.append(wall);
  return figure;
}
function locationCard(item){
  const free=item.car+item.bike;
  const card=h('article',{class:`home-card${item.full?' home-card-full':''}`});
  const picture=h('div',{class:'home-picture'},h('span',{class:'home-code'},item.code),building(item.art));
  if(item.full)picture.append(h('span',{class:'home-full-tag'},'ที่จอดเต็ม'));
  const body=h('div',{class:'home-card-body'},h('h3',null,item.name));
  for (const [icon,title,num] of [['🚗','รถยนต์/EV',item.car],['🏍','มอเตอร์ไซค์',item.bike]]) {
    body.append(h('p',{class:`home-status ${num===0?'home-status-full':num<10?'home-status-warn':'home-status-free'}`},
    h('span',{'aria-hidden':'true'},icon),`${title} ${num===0?'เต็ม':`ว่าง ${num}`}`));
  }
  body.append(h('div',{class:'home-bar','aria-hidden':'true'},h('span',{style:`width:${item.full?100:Math.max(12,100-Math.min(free,50)*1.2)}%`})));
  const pin = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg> `;
  const location = h('p', { class: 'home-location' });
  location.innerHTML = `${pin} <span></span>`;
  location.querySelector('span').textContent = item.location;
  body.append(location);
    const action=h('a',{class:`home-select${item.full?' home-select-disabled':''}`,href:item.full?undefined:`#/booking?lot=${encodeURIComponent(item.id)}`},item.full?'🔒 ที่จอดเต็ม · ไม่สามารถจองได้':'เลือกช่องจอด ›');
      if (item.full) { action.setAttribute('aria-disabled','true');
         action.tabIndex=-1;
      }
    body.append(action);
    card.append(picture,body);
    return card;
}
function section(title,items){
  const section=h('section',{class:'home-section'}), track=h('div',{class:'home-list',tabindex:'0','aria-label':`พื้นที่จอด ${title}`});
  track.append(...items.map(locationCard));
  const prev=h('button',{type:'button',class:'home-arrow','aria-label':`เลื่อน ${title} ไปทางซ้าย`},'❮');
  const next=h('button',{type:'button',class:'home-arrow','aria-label':`เลื่อน ${title} ไปทางขวา`},'❯');
  prev.addEventListener('click',()=>track.scrollBy({left:-track.clientWidth*.78,behavior:'smooth'}));
  next.addEventListener('click',()=>track.scrollBy({left:track.clientWidth*.78,behavior:'smooth'}));
  function update(){prev.disabled=track.scrollLeft<3;
    next.disabled=track.scrollLeft+track.clientWidth>=track.scrollWidth-3}
  track.addEventListener('scroll',update,{passive:true});
  const heading=h('div',{class:'home-section-head'},h('div',null,h('h2',null,title),h('p',null,'เลื่อนดูด้านข้างได้')),h('div',{class:'home-buttons'},prev,next));
  section.append(heading,track);
  queueMicrotask(update);
  return section;
}
export function HomePage(ctx={params:{}}){
  const root=h('div',{class:'home'});
  const hero=h('section',{class:'home-banner'},h('p',{class:'home-tag'},'SmartPark TU'),h('h1',null,'ค้นหาที่จอดรถที่เหมาะกับคุณ'),h('p',null,'เลือกพื้นที่จอด ดูช่องว่าง และจองได้ในไม่กี่ขั้นตอน'));
  root.append(hero);
  for(const group of ['กลุ่มอาคารเรียนรวม SC 1–3','หอสมุดป๋วย อึ๊งภากรณ์','ลานจอดเต็มแล้ว']) root.append(section(group,locations.filter(x=>x.group===group)));
  const links=h('section',{class:'home-menu'},h('h2',null,'เมนูใช้งาน'),h('div',{class:'home-menu-list'},
  ...[['ลงทะเบียนรถ','#/vehicle','ตรวจสอบนักศึกษาและบันทึกทะเบียนรถ'],['จองที่จอด','#/booking','เลือกวัน เวลา และช่องจอด'],['ตรวจบัตรและประวัติ','#/history','ดูบัตรจองและรายการจองย้อนหลัง'],['บัตรจอง','#/ticket/PK-TEST2345','ดูบัตรจองตามรหัส']].map(([label,url,desc])=>h('a',{href:url,class:'home-menu-link'},h('strong',null,label),h('span',null,desc),' →'))));
  root.append(links);
  return PageShell({title:'',children:root});
}

