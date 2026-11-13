/**
 * MemberRegisterPage — สมัครสมาชิก (Owner: Dev 2 | Ticket: US2 | Route: #/register)
 * สมัครสำเร็จ backend ล็อกอินให้อัตโนมัติ -> เก็บ user ลง store แล้วไปหน้าหลัก
 */
import { h } from '../core/dom.js';
import { MemberForm } from '../features/member/MemberForm.js';
import { registerMember } from '../api/members.js';
import { signIn } from '../features/auth/session.js';
import { showToast } from '../components/ui/Toast.js';

export function MemberRegisterPage() {
  return h('section', { class: 'login-page' },
    h('h1', { class: 'login-page__title' }, 'สมัครสมาชิก'),
    h('div', { class: 'login-form' },
      h('div', { class: 'login-form__tabs' },
        h('a', { href: '#/login', class: 'login-form__tab' }, 'เข้าสู่ระบบ'),
        h('span', { class: 'login-form__tab login-form__tab--active' }, 'สมัครสมาชิก')),
      MemberForm({
        onSubmit: async (data) => {
          const res = await registerMember(data);
          signIn({ student_id: res.member.student_id, name: res.member.name });
          showToast('สมัครสมาชิกสำเร็จ', 'success');
          window.location.hash = '#/';
        },
      })));
}
