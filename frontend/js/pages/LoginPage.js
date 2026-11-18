/**
 * LoginPage — หน้าเข้าสู่ระบบ (Figma: "Computer LoginTU")
 * Owner: Dev 1 | Ticket: US11 | Route: #/login (รองรับ #/login?next=/booking)
 *
 * AC: ข้อมูลถูก → ไปหน้าหลัก (หรือหน้าที่ถูกเด้งมา) · ผิด → error ข้อความเดียว · TC-US11-01..03
 */
import { h } from '../core/dom.js';
import { LoginForm } from '../features/auth/LoginForm.js';
import { LoginShowcase } from '../features/auth/LoginShowcase.js';
import { login } from '../api/auth.js';
import { signIn, nextFromHash } from '../features/auth/session.js';
import { showToast } from '../components/ui/Toast.js';

export function LoginPage() {
  return h('section', { class: 'login-page' },
    h('div', { class: 'login-page__intro' },
      h('p', { class: 'login-page__kicker' }, 'ที่จอดรถ มธ. ศูนย์รังสิต'),
      h('h2', { class: 'login-page__headline' }, 'จองช่องจอดไว้ก่อน แล้วขับตรงเข้าช่องได้เลย'),
      h('p', { class: 'login-page__lead' }, 'เลือกโซนและเวลา รับ QR Code แล้วสแกนเช็กอินหน้าลานจอด ถ้ามาไม่ทัน ระบบจะคืนช่องให้คนอื่นเอง'),
      LoginShowcase(),
    ),
    h('div', { class: 'login-page__panel' },
      h('h1', { class: 'login-page__title', id: 'login-title' }, 'เข้าสู่ระบบ'),
      LoginForm({
        onSubmit: async ({ studentId, password }) => {
          const data = await login({ studentId, password });
          signIn(data.user);
          showToast(`ยินดีต้อนรับ ${data.user?.name || data.user?.student_id || ''}`.trim(), 'success');
          window.location.hash = `#${nextFromHash()}`;
        },
      }),
      h('p', { class: 'login-page__note' }, 'ใช้รหัสนักศึกษาและรหัสผ่านเดียวกับระบบ มธ.'),
    ),
  );
}
