/**
 * LoginForm — การ์ดเข้าสู่ระบบ (ตาม Figma "Computer LoginTU")
 * Owner: Dev 1 | Ticket: US11
 * @param {{ onSubmit:(cred:{studentId:string,password:string})=>Promise<void> }} props
 * @returns {HTMLElement}
 *
 * - แท็บ "นักศึกษา / บุคลากร" = ฟอร์มนี้ · แท็บ "สมัครสมาชิก" = ลิงก์ไปหน้า #/register ของ Dev 2 (US2)
 * - error จาก backend แสดงข้อความเดียว ไม่บอกว่าผิดช่องไหน (AC US11)
 * - กดซ้ำระหว่างรอไม่ได้
 */
import { h, s } from '../../core/dom.js';
import { Alert } from '../../components/ui/Alert.js';
import { messageFor } from '../../api/errors.js';

export function LoginForm({ onSubmit } = {}) {
  let busy = false;

  const studentInput = h('input', {
    class: 'login-form__input',
    id: 'login-student-id',
    name: 'student_id',
    type: 'text',
    inputmode: 'numeric',
    autocomplete: 'username',
    maxlength: 10,
    required: true,
  });
  const passwordInput = h('input', {
    class: 'login-form__input',
    id: 'login-password',
    name: 'password',
    type: 'password',
    autocomplete: 'current-password',
    placeholder: 'รหัสผ่านบัญชี มธ.',
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
      href: '#/register',
    }, 'สมัครสมาชิก'),
  );

  return h('section', { class: 'login-form', 'aria-labelledby': 'login-title' },
    tabs,
    form,
  );
}