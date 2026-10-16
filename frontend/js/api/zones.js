/**
 * api/zones.js — ผังโซน/ช่องจอด และสถานะว่าง (Owner: Dev 3 | Ticket: BK-08)
 * รูปแบบข้อมูลดูที่ api/mock/zones.json และ availability.json (ตรงกับ Flask จริง)
 */
import { request } from './client.js';

/** GET /api/zones -> { open_time, close_time, zones:[{id,name,slots:[{id,label}]}] } */
export function getLayout() {
  return request('/api/zones', { mockFile: 'zones.json' });
}

/**
 * GET /api/availability?date=&start=&end= -> { slots:[{id,status,busy[]}], zones:[{id,free,total,full}] }
 * status: 'free' | 'partial' | 'booked'  (ใช้แสดงผลเท่านั้น ผู้ตัดสินการจองคือ backend)
 */
export function getAvailability({ date, start, end }) {
  const query = new URLSearchParams({ date, start, end });
  return request(`/api/availability?${query}`, { mockFile: 'availability.json' });
}
