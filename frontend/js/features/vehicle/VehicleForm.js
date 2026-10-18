/**
 * VehicleForm — ฟอร์มกรอกรหัสนักศึกษา, อีเมล มธ., ทะเบียนรถ, จังหวัด
 * Owner: Dev 2 | Ticket: VH-01 | Priority: P0
 * @param { {initial?:{studentId:string,email:string,plate:string,province:string}, busy?:boolean, errors?:Record<string,string>, onSubmit:(data:{studentId:string,email:string,plate:string,province:string})=>void} } props
 * @returns {HTMLElement}
 * Done when: validate รหัส นศ. 10 หลัก, อีเมลลงท้าย @dome.tu.ac.th, ทะเบียนรูปแบบไทย; ปุ่มกดซ้ำไม่ได้ขณะ busy
 * กติกา: ดู docs/CONVENTIONS.md (ไม่ fetch เอง, ไม่ hard-code สี, class ขึ้นต้น .vehicle-form- ใน VehicleForm.css)
 */
/** VehicleForm — VH-01 | ฟอร์ม 4 ช่อง พร้อม validation */
import { h } from '../../core/dom.js';
import { Button } from '../../components/ui/Button.js';
import { Alert } from '../../components/ui/Alert.js';

const PROVINCES = [
  "กรุงเทพมหานคร",
  "กระบี่",
  "กาญจนบุรี",
  "กาฬสินธุ์",
  "กำแพงเพชร",
  "ขอนแก่น",
  "จันทบุรี",
  "ฉะเชิงเทรา",
  "ชลบุรี",
  "ชัยนาท",
  "ชัยภูมิ",
  "ชุมพร",
  "เชียงราย",
  "เชียงใหม่",
  "ตรัง",
  "ตราด",
  "ตาก",
  "นครนายก",
  "นครปฐม",
  "นครพนม",
  "นครราชสีมา",
  "นครศรีธรรมราช",
  "นครสวรรค์",
  "นนทบุรี",
  "นราธิวาส",
  "น่าน",
  "บึงกาฬ",
  "บุรีรัมย์",
  "ปทุมธานี",
  "ประจวบคีรีขันธ์",
  "ปราจีนบุรี",
  "ปัตตานี",
  "พระนครศรีอยุธยา",
  "พะเยา",
  "พังงา",
  "พัทลุง",
  "พิจิตร",
  "พิษณุโลก",
  "เพชรบุรี",
  "เพชรบูรณ์",
  "แพร่",
  "ภูเก็ต",
  "มหาสารคาม",
  "มุกดาหาร",
  "แม่ฮ่องสอน",
  "ยโสธร",
  "ยะลา",
  "ร้อยเอ็ด",
  "ระนอง",
  "ระยอง",
  "ราชบุรี",
  "ลพบุรี",
  "ลำปาง",
  "ลำพูน",
  "เลย",
  "ศรีสะเกษ",
  "สกลนคร",
  "สงขลา",
  "สตูล",
  "สมุทรปราการ",
  "สมุทรสงคราม",
  "สมุทรสาคร",
  "สระแก้ว",
  "สระบุรี",
  "สิงห์บุรี",
  "สุโขทัย",
  "สุพรรณบุรี",
  "สุราษฎร์ธานี",
  "สุรินทร์",
  "หนองคาย",
  "หนองบัวลำภู",
  "อ่างทอง",
  "อำนาจเจริญ",
  "อุดรธานี",
  "อุตรดิตถ์",
  "อุทัยธานี",
  "อุบลราชธานี"
];
export function VehicleForm({ initial = {}, busy = false, errors = {}, onSubmit = () => { } } = {}) {
  const form = h('form', { class: 'vehicle-form-root', noValidate: true });
  const fields = {};
  const createField = (key, title, placeholder, options = {}) => {
    const id = `vehicle-form-${key}`;
    const input = h('input', {
      id, name: key, class: 'vehicle-form-input', placeholder,
      value: initial[key] || '', ...(options.maxLength ? { maxlength: options.maxLength } : {}),
      ...(options.inputMode ? { inputmode: options.inputMode } : {}),
      ...(options.type ? { type: options.type } : {}),
      autocomplete: 'off',
    });
    const error = h('small', { class: 'vehicle-form-error', id: `${id}-error` });
    fields[key] = { input, error };
    return h('div', { class: 'vehicle-form-field' },
      h('label', { for: id }, title), input, error);
  };
  const studentId = createField('studentId', 'รหัสนักศึกษา 10 หลัก', 'กรอกรหัสนักศึกษา', { maxLength: 10, inputMode: 'numeric' });
  const email = createField('email', 'อีเมลธรรมศาสตร์', 'example@dome.tu.ac.th', { type: 'email' });
  const plate = createField('plate', 'ทะเบียนรถ', 'กข 1234');
  const provinceSelect = h('select', { class: 'vehicle-form-input', id: 'vehicle-form-province', name: 'province' },
    h('option', { value: '' }, 'เลือกจังหวัด'),
    PROVINCES.map((name) => h('option', { value: name, ...(name === initial.province ? { selected: true } : {}) }, name)));
  const provinceError = h('small', { class: 'vehicle-form-error' });
  fields.province = { input: provinceSelect, error: provinceError };
  const province = h('div', { class: 'vehicle-form-field' },
    h('label', { for: 'vehicle-form-province' }, 'จังหวัด'), provinceSelect, provinceError);
  const errorNotice = Alert({ tone: 'info', message: 'กรุณาตรวจสอบรหัสนักศึกษา อีเมล และทะเบียนรถให้ถูกต้องก่อนลงทะเบียน' });
  const submit = Button({ label: 'ตรวจสอบและลงทะเบียน', type: 'submit', loading: busy });
  submit.classList.add('vehicle-form-submit');
  const showErrors = (next) => {
    for (const [key, field] of Object.entries(fields)) {
      const message = next[key] || '';
      field.error.textContent = message;
      field.input.setAttribute('aria-invalid', String(Boolean(message)));
    }
  };
  showErrors(errors);
  form.append(h('div', { class: 'vehicle-form-heading' },
    h('span', { class: 'vehicle-form-icon', 'aria-hidden': 'true' }, '🚗'),
    h('div', null, h('h2', null, 'ข้อมูลลงทะเบียนรถ'), h('p', null, 'กรอกข้อมูลนักศึกษาและข้อมูลรถให้ครบถ้วน'))),
    h('div', { class: 'vehicle-form-fields' }, studentId, email,
      h('div', { class: 'vehicle-form-two-columns' }, plate, province)), errorNotice, submit);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (submit.disabled) return;
    const data = Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.input.value.trim()]));
    const next = {};
    if (!/^\d{10}$/.test(data.studentId)) next.studentId = 'กรุณากรอกรหัสนักศึกษา 10 หลัก';
    if (!/^[^\s@]+@dome\.tu\.ac\.th$/i.test(data.email)) next.email = 'ใช้อีเมล @dome.tu.ac.th เท่านั้น';
    if (!/^[ก-ฮ0-9]{1,3}\s?[ก-ฮ0-9]{1,4}(?:\s?[0-9]{1,4})?$/.test(data.plate) || !/[ก-ฮ]/.test(data.plate) || !/\d/.test(data.plate)) {
      next.plate = 'กรุณากรอกทะเบียนรถไทย เช่น กข 1234 หรือ 1กข 1234';
    }
    if (!PROVINCES.includes(data.province)) next.province = 'กรุณาเลือกจังหวัด';
    showErrors(next);
    if (Object.keys(next).length) { fields[Object.keys(next)[0]].input.focus(); return; }
    onSubmit(data);
  });
  form.setBusy = (value) => { submit.disabled = value; submit.textContent = value ? 'กำลังตรวจสอบ…' : 'ตรวจสอบและลงทะเบียน'; };
  return form;
}

