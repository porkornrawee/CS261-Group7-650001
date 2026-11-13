/**
 * MemberForm — ฟอร์มสมัครสมาชิก (Owner: Dev 2 | Ticket: US2)
 * ตรวจฝั่งผู้ใช้ให้ตรงกับ backend/member_service.py: รหัส นศ. 10 หลัก, อีเมล, เบอร์ 10 หลักขึ้นต้น 0,
 * รหัสผ่านอย่างน้อย 8 ตัวและตรงกับช่องยืนยัน, ประเภทรถ car|motorcycle, ทะเบียนไทย, จังหวัด
 * @param { {busy?:boolean, onSubmit:(data:object)=>Promise<void>} } props
 */
import { h } from '../../core/dom.js';
import { PROVINCES } from '../vehicle/VehicleForm.js';

const PLATE_RE = /^[ก-ฮ0-9]{1,3}\s?[ก-ฮ0-9]{1,4}(?:\s?[0-9]{1,4})?$/;

export function MemberForm({ onSubmit = async () => {} } = {}) {
  const alertBox = h('div', { class: 'alert-root alert-root--error', role: 'alert', style: 'display:none' });
  const showError = (message) => {
    alertBox.textContent = message;
    alertBox.style.display = message ? '' : 'none';
  };

  const field = (label, name, attrs = {}) => {
    const id = `member-${name}`;
    const input = h('input', { id, name, class: 'login-form__input', required: true, ...attrs });
    return { input, row: h('div', null, h('label', { class: 'login-form__label', for: id }, label), input) };
  };

  const studentId = field('รหัสนักศึกษา 10 หลัก', 'student_id', { maxlength: 10, inputmode: 'numeric', autocomplete: 'off' });
  const name = field('ชื่อ-นามสกุล', 'name', { type: 'text', autocomplete: 'name' });
  const email = field('อีเมล', 'email', { type: 'email', autocomplete: 'email' });
  const phone = field('เบอร์โทรศัพท์', 'phone', { type: 'tel', inputmode: 'numeric', maxlength: 10, placeholder: '0812345678' });
  const plate = field('ทะเบียนรถ', 'plate', { type: 'text', placeholder: 'กข 1234', autocomplete: 'off' });

  const passwordField = (label, nameAttr) => {
    const input = h('input', {
      id: `member-${nameAttr}`, name: nameAttr, type: 'password', required: true,
      class: 'login-form__input', placeholder: '••••••••', autocomplete: 'new-password',
    });
    const toggle = h('button', {
      type: 'button', class: 'login-form__pw-toggle', 'aria-label': `แสดง/ซ่อน${label}`,
      onclick: () => {
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        toggle.textContent = show ? 'ซ่อน' : 'แสดง';
      },
    }, 'แสดง');
    return h('div', null,
      h('label', { class: 'login-form__label', for: input.id }, label),
      h('div', { class: 'login-form__pw' }, input, toggle));
  };

  const vehicleType = h('select', { id: 'member-vehicle_type', name: 'vehicle_type', class: 'login-form__input', required: true },
    h('option', { value: 'car' }, 'รถยนต์'),
    h('option', { value: 'motorcycle' }, 'รถจักรยานยนต์'));
  const province = h('select', { id: 'member-province', name: 'province', class: 'login-form__input', required: true },
    h('option', { value: '' }, 'เลือกจังหวัด'),
    PROVINCES.map((p) => h('option', { value: p }, p)));

  const submit = h('button', { type: 'submit', class: 'login-form__submit' }, 'สมัครสมาชิก');

  const form = h('form', {
    class: 'login-form__fields', noValidate: true,
    onsubmit: async (event) => {
      event.preventDefault();
      showError('');
      const fd = new FormData(form);
      const data = Object.fromEntries(['student_id', 'name', 'email', 'phone', 'password', 'vehicle_type', 'plate', 'province']
        .map((k) => [k, String(fd.get(k) ?? '').trim()]));
      const confirm = String(fd.get('confirmPassword') ?? '');
      // ไม่ trim รหัสผ่าน เพื่อให้ตรงกับที่ผู้ใช้พิมพ์จริง
      data.password = String(fd.get('password') ?? '');

      const problem =
        !/^\d{10}$/.test(data.student_id) ? 'กรุณากรอกรหัสนักศึกษา 10 หลัก'
        : !data.name ? 'กรุณากรอกชื่อ-นามสกุล'
        : !/^[\w.-]+@[\w.-]+\.\w+$/.test(data.email) ? 'รูปแบบอีเมลไม่ถูกต้อง'
        : !/^0\d{9}$/.test(data.phone) ? 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักขึ้นต้นด้วย 0'
        : data.password.length < 8 ? 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'
        : data.password !== confirm ? 'รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน'
        : !['car', 'motorcycle'].includes(data.vehicle_type) ? 'กรุณาเลือกประเภทรถ'
        : !PLATE_RE.test(data.plate) || !/[ก-ฮ]/.test(data.plate) || !/\d/.test(data.plate) ? 'กรุณากรอกทะเบียนรถไทย เช่น กข 1234 หรือ 1กข 1234'
        : !PROVINCES.includes(data.province) ? 'กรุณาเลือกจังหวัด'
        : '';
      if (problem) { showError(problem); return; }

      submit.disabled = true;
      submit.textContent = 'กำลังสมัครสมาชิก…';
      try {
        await onSubmit(data);
      } catch (err) {
        showError(err?.message || 'สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่');
      } finally {
        submit.disabled = false;
        submit.textContent = 'สมัครสมาชิก';
      }
    },
  },
    alertBox,
    studentId.row, name.row, email.row, phone.row,
    passwordField('รหัสผ่าน', 'password'),
    passwordField('ยืนยันรหัสผ่าน', 'confirmPassword'),
    h('div', null, h('label', { class: 'login-form__label', for: vehicleType.id }, 'ประเภทรถ'), vehicleType),
    plate.row,
    h('div', null, h('label', { class: 'login-form__label', for: province.id }, 'จังหวัด'), province),
    submit);
  return form;
}
