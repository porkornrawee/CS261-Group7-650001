/**
 * api/reservations.js — การจอง (create: Dev 3 | BK-08, lookup/list: Dev 4 | TK-03)
 * รูปแบบข้อมูลดู api/mock/reservation-created.json, reservations-list.json
 */
import { request } from './client.js';

/**
 * POST /api/reservations
 * @param {{user_name:string, slot_id:number, date:string, start:string, end:string}} input
 * @returns {Promise<{ok:true, reservation:object, qr_data_uri:string, qr_url:string}>}
 * ผิดพลาด -> throw ApiError(code) ดู api/errors.js
 */
export function createReservation(input) {
  return request('/api/reservations', { method: 'POST', body: input, mockFile: 'reservation-created.json' });
}

/** GET /api/reservations?limit= -> { reservations: [...] }  (Dev 4) */
export function listReservations(limit = 20) {
  return request(`/api/reservations?limit=${limit}`, { mockFile: 'reservations-list.json' });
}

/** GET /api/reservations/<code> -> { ok:true, reservation }  ไม่พบ = ApiError NOT_FOUND (Dev 4) */
export function getReservation(code) {
  return request(`/api/reservations/${encodeURIComponent(code)}`, { mockFile: 'reservation-created.json' });
}

/** URL ภาพ QR สำหรับ <img src> (Dev 4) */
export function qrUrl(code) {
  return `/api/reservations/${encodeURIComponent(code)}/qr.png`;
}
