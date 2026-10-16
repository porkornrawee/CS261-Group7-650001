/**
 * api/client.js — จุดเดียวที่เรียก fetch ของทั้งโปรเจกต์ (Owner: Dev 1 | Ticket: CO-03)
 *
 * โหมด mock: เปิดด้วย ?mock=1 ใน URL — ไฟล์ api/*.js ทุกตัวต้องเรียก request() ตัวนี้
 * แล้วส่ง mockFile เข้ามา เพื่อให้ทำ UI ได้โดยไม่ต้องรัน backend
 *
 * request(path, { method, body, mockFile }) -> Promise<object>
 *   - ปกติ: fetch(path) แล้วคืน JSON
 *   - mock : โหลด ./mock/<mockFile> (หน่วงเล็กน้อยให้เห็น loading)
 *   - ถ้า response.ok=false หรือ HTTP ไม่ผ่าน -> throw ApiError(code, message, status)
 */
export class ApiError extends Error {
  constructor(code, message, status) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

export function isMock() {
  return new URLSearchParams(window.location.search).get('mock') === '1';
}

export async function request(path, { method = 'GET', body, mockFile } = {}) {
  let data;
  let status = 200;
  if (isMock()) {
    if (!mockFile) throw new ApiError('MOCK_MISSING', `ยังไม่มี mock สำหรับ ${path}`, 0);
    await new Promise((resolve) => setTimeout(resolve, 300));
    const res = await fetch(new URL(`./mock/${mockFile}`, import.meta.url));
    data = await res.json();
    status = data.ok === false ? 400 : 200;
  } else {
    const res = await fetch(path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    status = res.status;
    data = await res.json().catch(() => ({}));
  }
  if (data.ok === false || status >= 400) {
    const err = data.error || {};
    throw new ApiError(err.code || 'UNKNOWN', err.message || 'เกิดข้อผิดพลาด', status);
  }
  return data;
}
