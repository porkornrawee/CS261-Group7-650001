/**
 * features/auth/session.js — สถานะการล็อกอินของทั้งแอป (Owner: Dev 1 | Ticket: US11)
 *
 * ensureSession()  : เรียก /api/auth/me ครั้งแรกครั้งเดียว แล้วเก็บผลลง store (user, authChecked)
 * signIn(user)     : เก็บ user ลง store หลังล็อกอินสำเร็จ
 * signOut()        : เรียก /api/auth/logout แล้วล้าง user และพาไปหน้า login
 * loginRedirect(path) / nextFromHash() : สร้าง/อ่าน #/login?next=<path> เพื่อกลับหน้าเดิมหลังล็อกอิน
 */
import { me, logout } from '../../api/auth.js';
import { getState, setState } from '../../store.js';

let pending = null;

export function ensureSession({ force = false } = {}) {
  if (getState().authChecked && !force) return Promise.resolve(getState().user);
  if (pending) return pending;
  pending = me()
    .then((data) => data.user || null)
    .catch(() => null) // 401 = ยังไม่ล็อกอิน, network error = ถือว่ายังไม่ล็อกอิน
    .then((user) => {
      setState({ user, authChecked: true });
      pending = null;
      return user;
    });
  return pending;
}

export function signIn(user) {
  setState({ user, authChecked: true });
}

export async function signOut() {
  try {
    await logout();
  } finally {
    setState({ user: null, authChecked: true, student: null, vehicle: null });
    window.location.hash = '#/login';
  }
}

/** หน้าที่ปลอดภัยให้กลับไปหลังล็อกอิน (กันลิงก์ภายนอก/วนกลับหน้า login) */
export function safeNext(next) {
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//')) return '/';
  if (next === '/login' || next.startsWith('/login?')) return '/';
  return next;
}

export function loginRedirect(path) {
  return path && path !== '/' ? `#/login?next=${encodeURIComponent(path)}` : '#/login';
}

export function nextFromHash(hash = window.location.hash) {
  const query = hash.split('?')[1] || '';
  return safeNext(new URLSearchParams(query).get('next') || '/');
}