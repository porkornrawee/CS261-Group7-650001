const $ = (selector) => document.querySelector(selector);
const form = $("#booking-form");
const stage = $("#stage");
let availabilityRequest = 0;

// ช่วงเวลาเปิด-ปิด (นาทีนับจากเที่ยงคืน) จะถูกเขียนทับด้วยค่าจาก /api/zones
let openMin = 8 * 60;
let closeMin = 20 * 60;
let duration = 60;               // ระยะเวลาที่เลือกจากชิป (นาที)
const slotInfo = new Map();      // slot id -> { label, zone, status, busy }

const STATUS_TEXT = { free: "ว่าง", partial: "ติดจอง", booked: "ไม่ว่าง" };
const STATUS_ICON = { free: "check", partial: "clock", booked: "car" };

const ERROR_TITLES = {
  SLOT_CONFLICT: "ช่องนี้ถูกจองแล้ว",
  ZONE_FULL: "โซนเต็ม",
  OUTSIDE_HOURS: "อยู่นอกเวลาเปิดทำการ",
  PAST_TIME: "เวลานี้ผ่านไปแล้ว",
  VALIDATION_ERROR: "ข้อมูลยังไม่ครบหรือไม่ถูกต้อง",
};
