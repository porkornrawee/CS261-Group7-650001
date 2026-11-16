/**
 * features/home/zones.js — รายชื่อลานจอดที่แสดงบนหน้าแรกและท้ายเว็บ (Owner: Dev 1 | Ticket: PG-01)
 * รูปภาพ: frontend/assets/<id>.jpg (ตัดขอบขาวที่ติดมาจาก Figma ออกจากไฟล์ภาพแล้ว — ห้ามใช้ scale ใน CSS ปิดขอบ)
 * ถ้ายังไม่มีไฟล์รูป การ์ดจะแสดงพื้นหลังสีแทนให้อัตโนมัติ
 * href ส่ง ?zone=<id> ไปหน้าจอง (Dev 3 อ่านค่านี้เพื่อเลือกลานจอดเริ่มต้นได้)
 */
export const ZONES = [
  // homeOrder = ลำดับบนหน้าแรกตาม Figma (ท้ายเว็บใช้ลำดับในอาร์เรย์นี้)
  { id: 'puey', image: { width: 1280, height: 450 }, group: 'learning', homeOrder: 2, name: 'หอสมุดป๋วยอึ๊งภากรณ์', href: '#/booking?zone=puey' },
  { id: 'lc', image: { width: 1279, height: 450 }, group: 'learning', homeOrder: 1, name: 'ศูนย์การเรียนรู้', href: '#/booking?zone=lc' },
  { id: 'sc1', image: { width: 822, height: 380 }, group: 'lecture', homeOrder: 3, name: 'อาคาร SC1', href: '#/booking?zone=sc1' },
  { id: 'sc2', image: { width: 820, height: 368 }, group: 'lecture', homeOrder: 4, name: 'อาคาร SC2', href: '#/booking?zone=sc2' },
  { id: 'sc3', image: { width: 818, height: 368 }, group: 'lecture', homeOrder: 5, name: 'อาคาร SC3', href: '#/booking?zone=sc3' },
];

export const ZONE_GROUPS = [
  { id: 'learning', title: 'โซนการเรียนรู้และหอสมุด' },
  { id: 'lecture', title: 'โซนอาคารบรรยายรวม' },
];

export function zoneImage(id) {
  return `assets/${id}.jpg`;
}