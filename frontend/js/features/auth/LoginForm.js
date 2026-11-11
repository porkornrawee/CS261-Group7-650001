/**
 * LoginForm — การ์ดเข้าสู่ระบบ (ตาม Figma "Computer LoginTU")
 * Owner: Dev 1 | Ticket: US11
 * @param {{ onSubmit:(cred:{studentId:string,password:string})=>Promise<void>, onSocial?:(name:string)=>void }} props
 * @returns {HTMLElement}
 *
 * - แท็บ "นักศึกษา / บุคลากร" = ฟอร์มนี้ · แท็บ "บุคคลทั่วไป" = ลิงก์ไปหน้า #/register-external ของ Dev 2 (US2)
 * - error จาก backend แสดงข้อความเดียว ไม่บอกว่าผิดช่องไหน (AC US11)
 * - กดซ้ำระหว่างรอไม่ได้
 */
import { h, s } from '../../core/dom.js';
import { Alert } from '../../components/ui/Alert.js';
import { messageFor } from '../../api/errors.js';

const SOCIALS = [
  {
    id: 'google',
    label: 'Google',
    icon: () => s('svg', { viewBox: '0 0 48 48', width: 30, height: 30, 'aria-hidden': 'true', focusable: 'false' },
      s('path', { style: 'fill: var(--brand-google-red)', d: 'M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.8 6.1C12.4 13.6 17.7 9.5 24 9.5z' }),
      s('path', { style: 'fill: var(--brand-google-blue)', d: 'M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z' }),
      s('path', { style: 'fill: var(--brand-google-yellow)', d: 'M10.5 28.7c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7l-7.8-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.8l7.8-6.1z' }),
      s('path', { style: 'fill: var(--brand-google-green)', d: 'M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.2-13.5-9.9l-7.8 6.1C6.6 42.6 14.6 48 24 48z' })),
  },
  {
    id: 'line',
    label: 'Line',
    icon: () => s('svg', { viewBox: '0 0 48 48', width: 30, height: 30, 'aria-hidden': 'true', focusable: 'false' },
      s('rect', { x: 2, y: 2, width: 44, height: 44, rx: 11, style: 'fill: var(--brand-line)' }),
      s('path', { style: 'fill: var(--on-brand)', d: 'M24 11c-8.8 0-16 5.7-16 12.8 0 6.3 5.7 11.6 13.4 12.6.5.1 1.2.3 1.4.8.2.4.1 1 .1 1.4l-.2 1.4c-.1.4-.3 1.6 1.4.9 1.7-.7 9.3-5.5 12.7-9.4 2.3-2.6 3.4-5.2 3.4-7.7C40 16.7 32.8 11 24 11z' })),
  },
  {
    id: 'facebook',
    label: 'Facebook',
    icon: () => s('svg', { viewBox: '0 0 48 48', width: 30, height: 30, 'aria-hidden': 'true', focusable: 'false' },
      s('path', { style: 'fill: var(--brand-facebook)', d: 'M27 46V27h6.4l1-7.4H27v-4.7c0-2.1.6-3.6 3.7-3.6h3.9V4.7c-.7-.1-3-.3-5.7-.3-5.6 0-9.5 3.4-9.5 9.7v5.5h-6.4V27h6.4v19H27z' })),
  },
  {
    id: 'apple',
    label: 'Apple',
    icon: () => s('svg', { viewBox: '0 0 48 48', width: 30, height: 30, 'aria-hidden': 'true', focusable: 'false' },
      s('path', { style: 'fill: var(--brand-apple)', d: 'M39.3 35.4c-.8 1.8-1.2 2.6-2.2 4.2-1.4 2.2-3.4 4.9-5.9 4.9-2.2 0-2.8-1.4-5.8-1.4s-3.7 1.5-5.9 1.4c-2.5 0-4.4-2.4-5.8-4.6-4-6.1-4.4-13.3-1.9-17.1 1.7-2.7 4.5-4.3 7.1-4.3 2.6 0 4.3 1.4 6.5 1.4 2.1 0 3.4-1.4 6.5-1.4 2.3 0 4.8 1.3 6.5 3.4-5.7 3.1-4.8 11.3.9 13.5zM29.6 10.2c1.1-1.4 2-3.4 1.6-5.5-1.8.1-4 1.3-5.3 2.8-1.2 1.4-2.1 3.4-1.7 5.4 2 .1 4.1-1.1 5.4-2.7z' })),
  },
];

export function LoginForm({ onSubmit, onSocial = () => {} } = {}) {
  let busy = false;

  const studentInput = h('input', {
    class: 'login-form__input',
    id: 'login-student-id',
    name: 'student_id',
    type: 'text',
    inputmode: 'numeric',
    autocomplete: 'username',
    maxlength: 10,
    placeholder: 'เช่น 650965xxxx',
    required: true,
  });
  const passwordInput = h('input', {
    class: 'login-form__input',
    id: 'login-password',
    name: 'password',
    type: 'password',
    autocomplete: 'current-password',
    placeholder: 'กรอกเลขประจำตัวบัตรประชาชน',
    required: true,
  });
  const alertBox = h('div', { class: 'login-form__alert', 'aria-live': 'assertive' });
  const submitButton = h('button', { class: 'login-form__submit', type: 'submit' }, 'Login');

  function setBusy(value) {
    busy = value;
    submitButton.disabled = value;
    submitButton.textContent = value ? 'กำลังเข้าสู่ระบบ…' : 'Login';
  }

  const form = h('form', {
    class: 'login-form__fields',
    novalidate: true,
    onSubmit: async (event) => {
      event.preventDefault();
      if (busy) return;
      alertBox.replaceChildren();
      const studentId = studentInput.value.trim();
      const password = passwordInput.value;
      if (!studentId || !password) {
        alertBox.replaceChildren(Alert({ tone: 'error', message: 'กรุณากรอกรหัสนักศึกษาและรหัสผ่าน' }));
        (studentId ? passwordInput : studentInput).focus();
        return;
      }
      setBusy(true);
      try {
        await onSubmit({ studentId, password });
      } catch (error) {
        passwordInput.value = '';
        alertBox.replaceChildren(Alert({ tone: 'error', message: messageFor(error) }));
        passwordInput.focus();
      } finally {
        setBusy(false);
      }
    },
  },
    h('label', { class: 'login-form__label', for: 'login-student-id' }, 'รหัสนักศึกษา'),
    studentInput,
    h('label', { class: 'login-form__label', for: 'login-password' }, 'รหัสผ่าน'),
    passwordInput,
    alertBox,
    submitButton,
  );

  const tabs = h('div', { class: 'login-form__tabs', role: 'tablist', 'aria-label': 'ประเภทผู้ใช้' },
    h('button', {
      class: 'login-form__tab login-form__tab--active',
      type: 'button',
      role: 'tab',
      'aria-selected': 'true',
    }, 'นักศึกษา / บุคลากร (จองฟรี)'),
    h('a', {
      class: 'login-form__tab',
      role: 'tab',
      'aria-selected': 'false',
      href: '#/register-external',
    }, 'บุคคลทั่วไป (฿10 - 20 / ชม.)'),
  );

  const socials = h('div', { class: 'login-form__socials' },
    SOCIALS.map((s) => h('button', {
      class: `login-form__social login-form__social--${s.id}`,
      type: 'button',
      'aria-label': `เข้าสู่ระบบด้วย ${s.label}`,
      onClick: () => onSocial(s.label),
    }, s.icon(), h('span', { class: 'login-form__social-label' }, s.label))),
  );

  return h('section', { class: 'login-form', 'aria-labelledby': 'login-title' },
    tabs,
    form,
    h('p', { class: 'login-form__divider' }, h('span', null, 'หรือเข้าสู่ระบบด้วยบัญชี')),
    socials,
  );
}