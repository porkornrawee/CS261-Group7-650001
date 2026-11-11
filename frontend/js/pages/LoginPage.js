/**
 * LoginPage — หน้าเข้าสู่ระบบ (Figma: "Computer LoginTU")
 * Owner: Dev 1 | Ticket: US11 | Route: #/login (รองรับ #/login?next=/booking)
 *
 * AC: ข้อมูลถูก → ไปหน้าหลัก (หรือหน้าที่ถูกเด้งมา) · ผิด → error ข้อความเดียว · TC-US11-01..03
 */
import { h } from '../core/dom.js';
import { LoginForm } from '../features/auth/LoginForm.js';
import { login } from '../api/auth.js';
import { signIn, nextFromHash } from '../features/auth/session.js';
import { showToast } from '../components/ui/Toast.js';

export function LoginPage() {
  return h('section', { class: 'login-page' },
    h('h1', { class: 'login-page__title', id: 'login-title' }, 'Login เข้าสู่ระบบ'),
    LoginForm({
      onSubmit: async ({ studentId, password }) => {
        const data = await login({ studentId, password });
        signIn(data.user);
        showToast(`ยินดีต้อนรับ ${data.user?.name || data.user?.student_id || ''}`.trim(), 'success');
        window.location.hash = `#${nextFromHash()}`;
      },
      onSocial: (name) => showToast(`ยังไม่เปิดให้เข้าสู่ระบบด้วย ${name} กรุณาใช้รหัสนักศึกษา`, 'info'),
    }),
  );
}