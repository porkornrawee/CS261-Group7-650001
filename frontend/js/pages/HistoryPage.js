/**
 * HistoryPage — หน้ารายการจองล่าสุด (ReservationTable)
 * Owner: Dev 4 | Ticket: PG-05 | Priority: P0 | Route: #/history
 * @param { { params: Record<string,string> } } ctx  พารามิเตอร์จาก URL (เช่น ticket → params.code)
 * @returns {HTMLElement}
 * Page เท่านั้นที่คุยกับ js/api/* และ js/store.js ได้ (component ใน ui/ ห้ามรู้จัก api)
 */
import { todo } from '../core/dom.js';


import { h } from '../core/dom.js';

export function HistoryPage(ctx = { params: {} }) {
  const container = h('div', { class: 'history-page', style: 'position: relative; min-height: 100vh; background: #f8fafc;' },
    
    // ฉากหลัง Overlay เบลอ
    h('div', { style: 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 42, 74, 0.45); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); z-index: 999; display: flex; align-items: center; justify-content: center; padding: 16px; box-sizing: border-box; overflow-y: auto;' },
      
      // Modal Card หลัก
      h('div', { style: 'background: #ffffff; width: 100%; max-width: 440px; max-height: 90vh; border-radius: 24px; padding: 24px 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.2); display: flex; flex-direction: column; overflow-y: auto; box-sizing: border-box;' },
        
        // Header Modal (หัวข้อ + ปุ่มปิด X)
        h('div', { style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;' },
          h('h2', { style: 'font-size: 18px; font-weight: 700; color: #0f2a4a; margin: 0;' }, 'ประวัติการจอง'),
          h('button', {
            style: 'width: 32px; height: 32px; border-radius: 50%; border: 1px solid #cbd5e1; background: #ffffff; color: #64748b; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center;',
            onClick: () => { window.location.hash = '#/'; }
          }, '✕')
        ),

        // รายการการจองที่ 1 (ใช้งานได้)
        createReservationCard({
          location: 'ที่จอดอาคาร SC 1',
          statusText: 'ใช้งานได้',
          statusBg: '#e6f4ea',
          statusColor: '#137333',
          code: 'SP261019-PWPA',
          zoneSlot: 'มอเตอร์ไซค์ · M22',
          date: '19 ต.ค. 2569',
          time: '13:00 – 15:00 น.',
          vehicle: 'มอเตอร์ไซค์',
          onViewQr: () => { window.location.hash = '#/ticket/SP261019-PWPA'; }
        }),

        // รายการการจองที่ 2 (ใช้งานได้)
        createReservationCard({
          location: 'ที่จอดอาคาร SC 1',
          statusText: 'ใช้งานได้',
          statusBg: '#e6f4ea',
          statusColor: '#137333',
          code: 'SP261019-QCR9',
          zoneSlot: 'มอเตอร์ไซค์ · M23',
          date: '19 ต.ค. 2569',
          time: '13:00 – 15:00 น.',
          vehicle: 'มอเตอร์ไซค์',
          onViewQr: () => { window.location.hash = '#/ticket/SP261019-QCR9'; }
        }),

        // รายการการจองที่ 3 (ยกเลิกแล้ว)
        createReservationCard({
          location: 'ที่จอดอาคาร SC 1',
          statusText: 'ยกเลิกแล้ว',
          statusBg: '#fce8e6',
          statusColor: '#b5121b',
          code: 'SP261019-B5U6',
          zoneSlot: 'รถยนต์ / EV · A3',
          date: '19 ต.ค. 2569',
          time: '13:00 – 15:00 น.',
          vehicle: 'รถยนต์',
          isCancelled: true
        })

      )
    )
  );

  return container;
}

// ฟังก์ชันย่อยสร้างการ์ดรายการจองแต่ละใบ
function createReservationCard(props) {
  const { location, statusText, statusBg, statusColor, code, zoneSlot, date, time, vehicle, isCancelled, onViewQr } = props;

  return h('div', { style: 'background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; margin-bottom: 16px; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.02);' },
    
    // แถวบน: สถานที่ และ ป้ายสถานะ
    h('div', { style: 'display: flex; justify-content: space-between; align-items: center;' },
      h('span', { style: 'font-size: 14px; font-weight: 700; color: #0f2a4a;' }, location),
      h('span', { style: `background: ${statusBg}; color: ${statusColor}; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px;` }, statusText)
    ),

    // รายละเอียดข้อมูลการจอง
    h('div', { style: 'font-size: 12px; display: flex; flex-direction: column; gap: 6px; color: #64748b;' },
      h('div', { style: 'display: flex; justify-content: space-between;' }, h('span', {}, 'รหัสการจอง'), h('strong', { style: 'color: #0f2a4a;' }, code)),
      h('div', { style: 'display: flex; justify-content: space-between;' }, h('span', {}, 'โซน / ช่องจอด'), h('strong', { style: 'color: #0f2a4a;' }, zoneSlot)),
      h('div', { style: 'display: flex; justify-content: space-between;' }, h('span', {}, 'วันที่'), h('strong', { style: 'color: #0f2a4a;' }, date)),
      h('div', { style: 'display: flex; justify-content: space-between;' }, h('span', {}, 'เวลา'), h('strong', { style: 'color: #0f2a4a;' }, time)),
      h('div', { style: 'display: flex; justify-content: space-between;' }, h('span', {}, 'ประเภทรถ'), h('strong', { style: 'color: #0f2a4a;' }, vehicle))
    ),

    // ปุ่มแอคชั่น (ถ้ายังไม่ยกเลิก)
    !isCancelled ? h('div', { style: 'display: flex; flex-direction: column; gap: 8px; margin-top: 4px;' },
      h('div', { style: 'display: flex; gap: 8px;' },
        h('button', {
          style: 'flex: 1; height: 36px; background: #ffffff; border: 1px solid #1a6cf0; color: #1a6cf0; border-radius: 18px; font-size: 12px; font-weight: 700; cursor: pointer;',
          onClick: onViewQr
        }, 'ดู QR Code'),
        h('button', {
          style: 'flex: 1; height: 36px; background: #ffffff; border: 1px solid #cbd5e1; color: #64748b; border-radius: 18px; font-size: 12px; font-weight: 700; cursor: pointer;',
          onClick: () => alert(`ยืนยันการยกเลิกการจองรหัส ${code}`)
        }, 'ยกเลิกการจอง')
      ),
      h('button', {
        style: 'width: 100%; height: 36px; background: #ffffff; border: 1px solid #cbd5e1; color: #64748b; border-radius: 18px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;',
        onClick: () => alert(`แจ้งปัญหาสำหรับรหัส ${code}`)
      }, '🚩 แจ้งปัญหา: มีรถอื่นจอดในช่องนี้')
    ) : null

  );
}