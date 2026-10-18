/**
 * BookingPage — หน้าจอง 3 ขั้น: เลือกวัน-เวลา → เลือกช่อง → ยืนยัน แล้วไป #/ticket/<code>  (ใช้ DateStrip, TimeChips, DurationPicker, ParkingLot, BookingSummary, api/zones.js, api/reservations.js)
 * Owner: Dev 3 | Ticket: PG-03 | Priority: P0 | Route: #/booking
 * @param { { params: Record<string,string> } } ctx  พารามิเตอร์จาก URL (เช่น ticket → params.code)
 * @returns {HTMLElement}
 * Page เท่านั้นที่คุยกับ js/api/* และ js/store.js ได้ (component ใน ui/ ห้ามรู้จัก api)
 */
import { todo } from '../core/dom.js';

/**
 * BookingPage — หน้าจองที่จอดรถ (ปรับหน้าตาช่องจอดรถยนต์แนวตั้งตรงตามดีไซน์ล่าสุด)
 */
import { h } from '../core/dom.js';

export function BookingPage(ctx = { params: {} }) {
  let selectedDay = '19';
  let selectedMonth = 'ตุลาคม';
  let selectedYear = '2569';
  let selectedPeriod = 'afternoon';
  let startTime = '13:00 น.';
  let endTime = '15:00 น.';
  let selectedVehicleType = 'car';
  let selectedSlotId = 'A5';
  let licensePlate = '';

  const container = h('div', { class: 'booking-page', style: 'max-width: 960px; margin: 0 auto; padding: 24px 16px; font-family: sans-serif; background: #f8fafc; min-height: 100vh;' },
    
    // หัวข้อหน้าสถานที่
    h('div', { style: 'margin-bottom: 20px;' },
      h('h1', { style: 'font-size: 22px; font-weight: 700; color: #0f2a4a; margin: 0 0 4px 0;' }, 'ที่จอดหอสมุดป๋วย อึ๊งภากรณ์'),
      h('div', { style: 'color: #7d8ba0; font-size: 13px;' }, '📍 ใกล้ประตูทางเข้าหลัก · ว่าง 48 ช่อง')
    ),

    // 1. กล่องผังที่จอดรถ (Parking Lot Grid)
    h('div', { class: 'card', style: 'background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);' },
      h('h3', { style: 'font-size: 16px; font-weight: 700; color: #0f2a4a; margin: 0 0 12px 0;' }, 'ผังที่จอด'),
      
      // สัญลักษณ์แสดงสถานะ (Legend)
      h('div', { style: 'display: flex; gap: 16px; font-size: 12px; color: #64748b; margin-bottom: 16px;' },
        h('div', { style: 'display: flex; align-items: center; gap: 6px;' },
          h('span', { style: 'width: 12px; height: 12px; border: 1.5px solid #1a6cf0; border-radius: 3px; display: inline-block;' }),
          'ว่าง'
        ),
        h('div', { style: 'display: flex; align-items: center; gap: 6px;' },
          h('span', { style: 'width: 12px; height: 12px; background: #cbd5e1; border-radius: 3px; display: inline-block;' }),
          'ไม่ว่าง'
        ),
        h('div', { style: 'display: flex; align-items: center; gap: 6px;' },
          h('span', { style: 'width: 12px; height: 12px; background: #1a6cf0; border-radius: 3px; display: inline-block;' }),
          'ที่คุณเลือก'
        )
      ),

      // พื้นที่ผังโซนรถยนต์ / EV
      h('div', { style: 'background: #ebf3fe; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 12px;' },
        h('div', { style: 'font-size: 13px; font-weight: 700; color: #0f2a4a;' }, '🚗 โซนรถยนต์ / ⚡ EV · ว่าง 18 ช่อง'),
        
        // แถว A (A1 - A16)
        h('div', { style: 'display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px;' },
          ...Array.from({ length: 16 }, (_, i) => {
            const slotName = `A${i + 1}`;
            // กำหนดสถานะไม่ว่างตามรูปตัวอย่าง
            const isBooked = [2, 4, 6, 7, 9, 10, 13, 16].includes(i + 1);
            const isSelected = slotName === selectedSlotId;

            let bgColor = '#ffffff';
            let borderColor = '#1a6cf0';
            let textColor = '#1a6cf0';
            let carBg = '#ebf3fe';

            if (isBooked) {
              bgColor = '#e2e8f0';
              borderColor = '#cbd5e1';
              textColor = '#94a3b8';
              carBg = '#cbd5e1';
            } else if (isSelected) {
              bgColor = '#ffffff';
              borderColor = '#1a6cf0';
              textColor = '#1a6cf0';
              carBg = '#dbeafe';
            }

            return h('button', {
              style: `min-width: 48px; height: 90px; border-radius: 10px; border: 1.5px solid ${borderColor}; background: ${bgColor}; color: ${textColor}; font-size: 12px; font-weight: 700; cursor: ${isBooked ? 'not-allowed' : 'pointer'}; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 8px 4px; transition: all 0.15s; box-shadow: ${isSelected ? '0 0 0 2px #1a6cf0' : 'none'};`,
              disabled: isBooked,
              onClick: () => {
                if (!isBooked) {
                  selectedSlotId = slotName;
                  renderAll();
                }
              }
            }, 
              h('span', {}, slotName),
              // รูปจำลองตัวรถด้านในช่อง
              h('div', { style: `width: 26px; height: 44px; border-radius: 6px; background: ${carBg}; border: 1px solid ${isBooked ? '#94a3b8' : '#93c5fd'};` }),
              h('span', { style: 'font-size: 9px; opacity: 0;' }, '-')
            );
          })
        ),

        // เส้นเลนทางรถวิ่งคั่นกลาง
        h('div', { style: 'border-bottom: 1.5px dashed #93c5fd; text-align: center; color: #64748b; font-size: 11px; margin: 4px 0; position: relative;' },
          h('span', { style: 'background: #ebf3fe; padding: 0 12px; position: relative; top: -7px; font-weight: 600;' }, 'ทางรถวิ่ง')
        ),

        // แถว B (B1 - B16)
        h('div', { style: 'display: flex; gap: 8px; overflow-x: auto; padding-top: 4px;' },
          ...Array.from({ length: 16 }, (_, i) => {
            const slotName = `B${i + 1}`;
            const isBooked = [1, 2, 4, 5, 6, 7, 10, 11, 13, 14, 16].includes(i + 1);
            const isSelected = slotName === selectedSlotId;

            let bgColor = '#ffffff';
            let borderColor = '#1a6cf0';
            let textColor = '#1a6cf0';
            let carBg = '#ebf3fe';

            if (isBooked) {
              bgColor = '#e2e8f0';
              borderColor = '#cbd5e1';
              textColor = '#94a3b8';
              carBg = '#cbd5e1';
            } else if (isSelected) {
              bgColor = '#ffffff';
              borderColor = '#1a6cf0';
              textColor = '#1a6cf0';
              carBg = '#dbeafe';
            }

            return h('button', {
              style: `min-width: 48px; height: 90px; border-radius: 10px; border: 1.5px solid ${borderColor}; background: ${bgColor}; color: ${textColor}; font-size: 12px; font-weight: 700; cursor: ${isBooked ? 'not-allowed' : 'pointer'}; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 8px 4px; transition: all 0.15s; box-shadow: ${isSelected ? '0 0 0 2px #1a6cf0' : 'none'};`,
              disabled: isBooked,
              onClick: () => {
                if (!isBooked) {
                  selectedSlotId = slotName;
                  renderAll();
                }
              }
            }, 
              h('span', {}, slotName),
              h('div', { style: `width: 26px; height: 44px; border-radius: 6px; background: ${carBg}; border: 1px solid ${isBooked ? '#94a3b8' : '#93c5fd'};` }),
              h('span', { style: 'font-size: 9px; opacity: 0;' }, '-')
            );
          })
        )
      )
    ),

    // 2. ฟอร์มและสรุปข้อมูล
    h('div', { id: 'form-and-summary-section' })
  );

  function renderAll() {
    const sec = container.querySelector('#form-and-summary-section');
    if (!sec) return;
    sec.innerHTML = '';

    const formGrid = h('div', { style: 'display: grid; grid-template-columns: 1fr 320px; gap: 20px;' },
      
      // คอลัมน์ซ้าย: ฟอร์มเลือกวันเวลา
      h('div', { class: 'card', style: 'background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);' },
        
        // ดรอปดาวน์ วัน / เดือน / ปี
        h('div', { style: 'display: flex; gap: 10px; margin-bottom: 16px;' },
          h('select', { 
            style: 'flex: 1; padding: 10px 12px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 13px; color: #0f2a4a;',
            onChange: (e) => { selectedDay = e.target.value; renderAll(); }
          }, 
            ['18', '19', '20', '21'].map(d => h('option', { value: d, selected: d === selectedDay }, d))
          ),
          h('select', { 
            style: 'flex: 1; padding: 10px 12px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 13px; color: #0f2a4a;',
            onChange: (e) => { selectedMonth = e.target.value; renderAll(); }
          }, 
            ['ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'].map(m => h('option', { value: m, selected: m === selectedMonth }, m))
          ),
          h('select', { 
            style: 'flex: 1; padding: 10px 12px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 13px; color: #0f2a4a;',
            onChange: (e) => { selectedYear = e.target.value; renderAll(); }
          }, 
            ['2569', '2570'].map(y => h('option', { value: y, selected: y === selectedYear }, y))
          )
        ),

        // ปุ่มสลับ ช่วงเช้า / ช่วงบ่าย
        h('div', { style: 'display: flex; background: #f1f5f9; border-radius: 20px; padding: 4px; margin-bottom: 16px;' },
          h('button', {
            style: `flex: 1; padding: 8px; border: none; border-radius: 16px; font-size: 13px; font-weight: 700; cursor: pointer; background: ${selectedPeriod === 'morning' ? '#1a6cf0' : 'transparent'}; color: ${selectedPeriod === 'morning' ? '#ffffff' : '#64748b'};`,
            onClick: () => { selectedPeriod = 'morning'; startTime = '09:00 น.'; endTime = '11:00 น.'; renderAll(); }
          }, '☀️ ช่วงเช้า'),
          h('button', {
            style: `flex: 1; padding: 8px; border: none; border-radius: 16px; font-size: 13px; font-weight: 700; cursor: pointer; background: ${selectedPeriod === 'afternoon' ? '#1a6cf0' : 'transparent'}; color: ${selectedPeriod === 'afternoon' ? '#ffffff' : '#64748b'};`,
            onClick: () => { selectedPeriod = 'afternoon'; startTime = '13:00 น.'; endTime = '15:00 น.'; renderAll(); }
          }, '🌤️ ช่วงบ่าย')
        ),

        // เลือกเวลาเริ่ม - สิ้นสุด
        h('div', { style: 'display: flex; gap: 12px; align-items: center; margin-bottom: 12px;' },
          h('div', { style: 'flex: 1;' },
            h('label', { style: 'font-size: 12px; color: #64748b; display: block; margin-bottom: 4px;' }, 'เริ่มเวลา'),
            h('select', { 
              style: 'width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 13px;',
              onChange: (e) => { startTime = e.target.value; renderAll(); }
            },
              ['13:00 น.', '14:00 น.', '15:00 น.'].map(t => h('option', { value: t, selected: t === startTime }, t))
            )
          ),
          h('span', { style: 'font-size: 12px; color: #64748b; margin-top: 18px;' }, 'ถึง'),
          h('div', { style: 'flex: 1;' },
            h('label', { style: 'font-size: 12px; color: #64748b; display: block; margin-bottom: 4px;' }, 'สิ้นสุดเวลา'),
            h('select', { 
              style: 'width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 13px;',
              onChange: (e) => { endTime = e.target.value; renderAll(); }
            },
              ['15:00 น.', '16:00 น.', '17:00 น.'].map(t => h('option', { value: t, selected: t === endTime }, t))
            )
          )
        ),

        h('div', { style: 'font-size: 12px; font-weight: 700; color: #1a6cf0; margin-bottom: 16px;' }, 'ระยะเวลาจอง 2 ชั่วโมง'),

        // เลือกประเภทรถ
        h('div', { style: 'margin-bottom: 16px;' },
          h('label', { style: 'font-size: 12px; font-weight: 700; color: #0f2a4a; display: block; margin-bottom: 8px;' }, 'ประเภทรถ'),
          h('div', { style: 'display: flex; gap: 8px;' },
            [
              { id: 'car', label: '🚗 รถยนต์' },
              { id: 'moto', label: '🛵 มอเตอร์ไซค์' },
              { id: 'ev', label: '⚡ รถไฟฟ้า (EV)' }
            ].map(type => {
              const isSelected = type.id === selectedVehicleType;
              return h('button', {
                style: `padding: 8px 14px; border-radius: 20px; border: 1px solid ${isSelected ? '#1a6cf0' : '#cbd5e1'}; background: ${isSelected ? '#ebf3fe' : '#ffffff'}; color: ${isSelected ? '#1a6cf0' : '#0f2a4a'}; font-size: 12px; font-weight: 700; cursor: pointer;`,
                onClick: () => { selectedVehicleType = type.id; renderAll(); }
              }, type.label);
            })
          )
        ),

        // ทะเบียนรถ
        h('div', {},
          h('label', { style: 'font-size: 12px; font-weight: 700; color: #0f2a4a; display: block; margin-bottom: 6px;' }, 'ทะเบียนรถ (ไม่บังคับ)'),
          h('input', {
            type: 'text',
            placeholder: 'เช่น 1กก 1234',
            value: licensePlate,
            style: 'width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 13px; box-sizing: border-box;',
            onInput: (e) => { licensePlate = e.target.value; }
          }),
          h('div', { style: 'font-size: 11px; color: #94a3b8; margin-top: 4px;' }, 'ตัวอย่าง: 1กก 1234 · กข 99 · 9งค 5678')
        )
      ),

      // คอลัมน์ขวา: สรุปข้อมูล
      h('div', { style: 'display: flex; flex-direction: column; justify-content: space-between;' },
        h('div', { style: 'background: #ebf3fe; border-radius: 16px; padding: 16px; font-size: 12px; display: flex; flex-direction: column; gap: 8px;' },
          h('div', { style: 'display: flex; justify-content: space-between;' }, h('span', { style: 'color: #64748b;' }, 'ที่จอด'), h('strong', { style: 'color: #0f2a4a;' }, 'หอสมุดป๋วย อึ๊งภากรณ์')),
          h('div', { style: 'display: flex; justify-content: space-between;' }, h('span', { style: 'color: #64748b;' }, 'โซน'), h('strong', { style: 'color: #0f2a4a;' }, selectedSlotId.startsWith('A') || selectedSlotId.startsWith('B') ? 'รถยนต์ / EV' : 'มอเตอร์ไซค์')),
          h('div', { style: 'display: flex; justify-content: space-between;' }, h('span', { style: 'color: #64748b;' }, 'ช่องจอด'), h('strong', { style: 'color: #0f2a4a;' }, selectedSlotId || 'ยังไม่เลือก')),
          h('div', { style: 'display: flex; justify-content: space-between;' }, h('span', { style: 'color: #64748b;' }, 'วันที่'), h('strong', { style: 'color: #0f2a4a;' }, `${selectedDay} ${selectedMonth} ${selectedYear}`)),
          h('div', { style: 'display: flex; justify-content: space-between;' }, h('span', { style: 'color: #64748b;' }, 'เวลา'), h('strong', { style: 'color: #0f2a4a;' }, `${startTime.replace(' น.', '')} – ${endTime}`)),
          h('div', { style: 'display: flex; justify-content: space-between;' }, h('span', { style: 'color: #64748b;' }, 'ประเภทรถ'), h('strong', { style: 'color: #0f2a4a;' }, selectedVehicleType === 'car' ? 'รถยนต์' : selectedVehicleType === 'moto' ? 'มอเตอร์ไซค์' : 'รถไฟฟ้า (EV)')),
          h('div', { style: 'display: flex; justify-content: space-between;' }, h('span', { style: 'color: #64748b;' }, 'ค่าบริการ'), h('strong', { style: 'color: #137333;' }, 'ฟรี (อีเมล TU)'))
        ),

        // ปุ่มยืนยัน
        h('button', {
          style: 'width: 100%; height: 44px; background: #1a6cf0; color: #ffffff; border: none; border-radius: 22px; font-size: 14px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(26,108,240,0.3); margin-top: 16px;',
          onClick: () => {
            window.location.hash = '#/ticket/SP261019-PWPA';
          }
        }, 'ยืนยันการจอง')
      )
    );

    sec.appendChild(formGrid);
  }

  renderAll();
  return container;
}