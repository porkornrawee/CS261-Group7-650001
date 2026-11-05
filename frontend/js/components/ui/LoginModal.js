/**
 * LoginModal — Modal เข้าสู่ระบบ: header ไล่เฉดสีฟ้า, เลือกประเภทผู้ใช้, social logins, ฟอร์ม email/password
 */
import { h } from '../../core/dom.js';
import { Button } from './Button.js';
import { Field } from './Field.js';

export function LoginModal({ onLoginSuccess = () => {} } = {}) {
  let activeUserType = 'student'; // 'student' | 'general'

  const dialog = h('dialog', { class: 'login-dialog', id: 'login-dialog' });

  function renderContent() {
    const studentTab = h('button', {
      type: 'button',
      class: `login-modal__type-btn${activeUserType === 'student' ? ' login-modal__type-btn--active' : ''}`,
      onClick: () => { activeUserType = 'student'; renderContent(); },
    }, 'นักศึกษา / บุคลากร (จองฟรี)');

    const generalTab = h('button', {
      type: 'button',
      class: `login-modal__type-btn${activeUserType === 'general' ? ' login-modal__type-btn--active' : ''}`,
      onClick: () => { activeUserType = 'general'; renderContent(); },
    }, 'บุคคลทั่วไป (฿10-20 / ชม.)');

    const form = h('form', {
      class: 'login-modal__form',
      onSubmit: (e) => {
        e.preventDefault();
        dialog.close();
        onLoginSuccess();
      }
    },
      Field({
        id: 'login-account',
        label: activeUserType === 'student' ? 'รหัสนักศึกษา / TU Account' : 'อีเมล / เบอร์โทรศัพท์',
        placeholder: activeUserType === 'student' ? 'เช่น 650965xxxx' : 'example@email.com',
        type: 'text'
      }),
      Field({
        id: 'login-password',
        label: 'รหัสผ่าน',
        type: 'password',
        placeholder: 'กรอกรหัสผ่าน'
      }),
      Button({
        label: 'เข้าสู่ระบบ',
        type: 'submit',
        tone: 'primary',
        onClick: () => {}
      })
    );

    const content = h('div', { class: 'login-modal' },
      h('div', { class: 'login-modal__header' },
        h('div', null,
          h('h2', { class: 'login-modal__title' }, 'เข้าสู่ระบบ SmartPark TU'),
          h('p', { class: 'login-modal__subtitle' }, 'เข้าใช้งานเพื่อความสะดวกในการจองที่จอดรถ')
        ),
        h('button', {
          type: 'button',
          class: 'login-modal__close',
          'aria-label': 'ปิดหน้าต่าง',
          onClick: () => dialog.close(),
        }, '✕')
      ),
      h('div', { class: 'login-modal__body' },
        h('div', { class: 'login-modal__types' }, studentTab, generalTab),
        h('div', { class: 'login-modal__socials' },
          h('button', { type: 'button', class: 'login-modal__social-btn login-modal__social-btn--google' },
            h('span', { class: 'login-modal__social-icon' }, 'G'),
            h('span', null, 'Google')
          ),
          h('button', { type: 'button', class: 'login-modal__social-btn login-modal__social-btn--line' },
            h('span', { class: 'login-modal__social-icon' }, '💬'),
            h('span', null, 'LINE')
          ),
          h('button', { type: 'button', class: 'login-modal__social-btn login-modal__social-btn--facebook' },
            h('span', { class: 'login-modal__social-icon' }, 'f'),
            h('span', null, 'Facebook')
          ),
          h('button', { type: 'button', class: 'login-modal__social-btn login-modal__social-btn--apple' },
            h('span', { class: 'login-modal__social-icon' }, ''),
            h('span', null, 'Apple')
          )
        ),
        h('div', { class: 'login-modal__divider' }, 'หรือเข้าสู่ระบบด้วยบัญชี'),
        form
      )
    );

    dialog.replaceChildren(content);
  }

  renderContent();
  return dialog;
}
