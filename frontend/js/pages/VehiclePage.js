/**
 * VehiclePage — หน้าลงทะเบียนรถ ตาม sequence: กรอก → verify กับ TU → บันทึก → แสดงผล / Invalid user  (ใช้ VehicleForm, StudentVerifyStatus, VehicleCard, api/vehicles.js)
 * Owner: Dev 2 | Ticket: PG-02 | Priority: P0 | Route: #/vehicle
 * @param { { params: Record<string,string> } } ctx  พารามิเตอร์จาก URL (เช่น ticket → params.code)
 * @returns {HTMLElement}
 * Page เท่านั้นที่คุยกับ js/api/* และ js/store.js ได้ (component ใน ui/ ห้ามรู้จัก api)
 */
import { h } from '../core/dom.js';
import { PageShell } from '../components/layout/PageShell.js';
import { VehicleForm } from '../features/vehicle/VehicleForm.js';
import { StudentVerifyStatus } from '../features/vehicle/StudentVerifyStatus.js';
import { VehicleCard } from '../features/vehicle/VehicleCard.js';
import { verifyStudent, saveVehicle } from '../api/vehicles.js';
import { messageFor } from '../api/errors.js';
import { setState } from '../store.js';

export function VehiclePage() {
  const status = h('div', { class: 'vehicle-page-status' });
  const result = h('div', { class: 'vehicle-page-result' });
  const show = (props) => status.replaceChildren(StudentVerifyStatus(props));
  const form = VehicleForm({
    onSubmit: async (data) => {
      form.setBusy(true);
      result.replaceChildren();
      show({ state: 'checking' });
      try {
        const verification = await verifyStudent({ student_id: data.studentId, email: data.email });
        const student = {
          ...verification.student,
          student_id: data.studentId,
          email: data.email,
        };
        show({ state: 'ok', student });
        const saved = await saveVehicle({ student_id: data.studentId, plate: data.plate, province: data.province });
        const vehicle = { ...saved.vehicle, studentId: data.studentId, plate: data.plate, province: data.province };
        setState({ student, vehicle });
        result.replaceChildren(VehicleCard({ vehicle }),
          h('a', { class: 'vehicle-page-next', href: '#/booking' }, 'ไปหน้าจองที่จอดรถ →'));
      } catch (error) {
        const code = error?.code;
        show({ state: code === 'TU_NOT_FOUND' ? 'invalid' : 'unavailable', message: messageFor(error) });
      } finally { form.setBusy(false); }
    }
  });
  return PageShell({
    title: 'ลงทะเบียนรถ',
    subtitle: 'ใช้รหัสนักศึกษาและอีเมลธรรมศาสตร์เพื่อลงทะเบียนรถ',
    children: [form, status, result],
  });
}
