/**
 * TicketPage — หน้าบัตรจอง (โหลดจากรหัสใน URL) + ReservationLookup
 * Owner: Dev 4 | Ticket: PG-04 | Priority: P0 | Route: #/ticket/:code
 * @param { { params: Record<string,string> } } ctx  พารามิเตอร์จาก URL (เช่น ticket → params.code)
 * @returns {HTMLElement}
 * Page เท่านั้นที่คุยกับ js/api/* และ js/store.js ได้ (component ใน ui/ ห้ามรู้จัก api)
 */
import { todo } from '../core/dom.js';

/**
 * TicketPage — หน้าแสดงใบจองสำเร็จพร้อม QR Code (Single-file component)
 */
import { h } from '../core/dom.js';

export function TicketPage(ctx = { params: {} }) {
  const code = ctx.params?.code || 'SP261019-PWPA';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(code)}`;

  const container = h('div', { class: 'ticket-page' },
    
    // ฉากหลัง Overlay เบลอ
    h('div', { style: 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 42, 74, 0.45); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); z-index: 999; display: flex; align-items: center; justify-content: center; padding: 16px; box-sizing: border-box;' },
      
      // การ์ด Pop-up บัตรจองตรงกลาง
      h('div', { style: 'background: #ffffff; width: 100%; max-width: 380px; border-radius: 20px; padding: 24px 20px; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2); display: flex; flex-direction: column; align-items: center; text-align: center;' },
        
        // ไอคอนวงกลมติ๊กถูกสีเขียว
        h('div', { style: 'width: 42px; height: 42px; background-color: #e6f4ea; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;' },
          h('span', { style: 'color: #137333; font-size: 20px; font-weight: bold;' }, '✓')
        ),
        
        h('h2', { style: 'font-size: 18px; font-weight: 700; color: #0f2a4a; margin: 0 0 14px 0;' }, 'จองสำเร็จแล้ว'),
        
        // กรอบแสดง QR Code
        h('div', { style: 'background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 8px; margin-bottom: 10px; width: 140px; height: 140px; display: flex; align-items: center; justify-content: center;' },
          h('img', { 
            src: qrUrl, 
            alt: `QR Code ${code}`,
            style: 'width: 100%; height: 100%; object-fit: contain;' 
          })
        ),
        
        h('div', { style: 'font-size: 11px; color: #7d8ba0; margin-bottom: 4px;' }, 'แสดง QR Code นี้เมื่อถึงเวลาเข้าลานจอด'),
        h('div', { style: 'font-size: 13px; font-weight: 700; color: #0f2a4a; margin-bottom: 16px; letter-spacing: 0.3px;' }, `รหัสการจอง ${code}`),
        
        // รายละเอียดตารางการจอง
        h('div', { style: 'width: 100%; background: #f8fafc; border-radius: 12px; padding: 12px 16px; margin-bottom: 18px; display: flex; flex-direction: column; gap: 6px; font-size: 12px; box-sizing: border-box;' },
          h('div', { style: 'display: flex; justify-content: space-between;' }, 
            h('span', { style: 'color: #7d8ba0;' }, 'ที่จอด'), 
            h('strong', { style: 'color: #0f2a4a;' }, 'อาคาร SC 1')
          ),
          h('div', { style: 'display: flex; justify-content: space-between;' }, 
            h('span', { style: 'color: #7d8ba0;' }, 'โซน'), 
            h('strong', { style: 'color: #0f2a4a;' }, 'มอเตอร์ไซค์')
          ),
          h('div', { style: 'display: flex; justify-content: space-between;' }, 
            h('span', { style: 'color: #7d8ba0;' }, 'ช่องจอด'), 
            h('strong', { style: 'color: #0f2a4a;' }, 'M22')
          ),
          h('div', { style: 'display: flex; justify-content: space-between;' }, 
            h('span', { style: 'color: #7d8ba0;' }, 'วันที่'), 
            h('strong', { style: 'color: #0f2a4a;' }, '19 ต.ค. 2569')
          ),
          h('div', { style: 'display: flex; justify-content: space-between;' }, 
            h('span', { style: 'color: #7d8ba0;' }, 'เวลา'), 
            h('strong', { style: 'color: #0f2a4a;' }, '13:00 – 15:00 น.')
          ),
          h('div', { style: 'display: flex; justify-content: space-between;' }, 
            h('span', { style: 'color: #7d8ba0;' }, 'ประเภทรถ'), 
            h('strong', { style: 'color: #0f2a4a;' }, 'มอเตอร์ไซค์')
          ),
          h('div', { style: 'display: flex; justify-content: space-between;' }, 
            h('span', { style: 'color: #7d8ba0;' }, 'ค่าบริการ'), 
            h('strong', { style: 'color: #137333;' }, 'ฟรี (อีเมล TU)')
          )
        ),
        
        // ปุ่มกลับหน้าแรก
        h('button', {
          style: 'width: 100%; height: 42px; background-color: #1a6cf0; color: #ffffff; border: none; border-radius: 21px; font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(26,108,240,0.3);',
          type: 'button',
          onClick: () => { window.location.hash = '#/'; }
        }, 'กลับหน้าแรก')

      )
    )
  );

  return container;
}

export const Ticket = TicketPage;