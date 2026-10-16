# ใบงาน (TASKS)

> ส่งแค่ Demo → ทำเฉพาะ **P0** ให้ครบก่อน ไม่ต้องทำ P2 เลย
> - **P0** = ต้องมีใน Demo (ไม่มี = สคริปต์ Demo เดินไม่ได้)
> - **P1** = ทำเมื่อ P0 ของตัวเองเสร็จและเพื่อนไม่ติดอะไรแล้ว
> - **P2** = **ข้าม** ไม่ต้องทำ (ใช้ HTML/CSS ธรรมดาในหน้านั้นแทน ไฟล์ stub ปล่อยไว้ไม่มีใครเรียกใช้ จึงไม่ขึ้นบนจอ)
>
> ทุก ticket เปิดไฟล์แล้วอ่านสัญญาบรรทัด 1-8 (หน้า pages/ บรรทัด 1-7) ก่อนเริ่ม · 1 ticket ≈ 1 PR · branch `fe/feat-<ชื่อ>` ตามกติกาใน README (ใส่เลข ticket ในชื่อ PR/commit)
> กติการวมดู `docs/CONVENTIONS.md` · วิธีทำงานทีละขั้นดู `README.md` หัวข้อ 5


## Dev 1 — ฐานราก: UI พื้นฐาน, หัวเว็บ, หน้าแรก
**ทุกคนรอคุณ** ทำ time.js + ไอคอนเป็นอย่างแรก แล้วตามด้วย Button/Card/Field

| ระดับ | Ticket | ไฟล์ | หน้าที่ | เกณฑ์ผ่านเพิ่มเติม |
|---|---|---|---|---|
| **P0** | CO-01 | `js/core/dom.js` | เติมไอคอน (ICONS/icon) จากโค้ดเก่า backend-python/static/js/dom.js บรรทัด 14-24 | ตาม contract ในไฟล์ |
| **P0** | CO-02 | `js/core/time.js` | ย้าย 5 ฟังก์ชันจาก backend-python/static/js/time-utils.js (Dev 2 รออยู่) **ทำเป็นอย่างแรก** | ตาม contract ในไฟล์ |
| **P0** | CO-06 | `js/main.js + index.html` | พอ AppHeader เสร็จ ลบเมนูชั่วคราว index.html บรรทัด 17-25 และ css/base.css บรรทัด 20-24 | ตาม contract ในไฟล์ |
| **P0** | LY-01 | `js/components/layout/AppHeader.js` + `.css` | หัวเว็บสีแดง มธ. + โลโก้ + เมนูนำทาง (Home, ลงทะเบียนรถ, จองที่จอด, ประวัติ) | โลโก้มุมซ้ายใช้ไฟล์ทางการ, เมนูไฮไลต์หน้าปัจจุบัน, พับเป็นแฮมเบอร์เกอร์บนมือถือ, แล้วลบ #dev-nav ใน index.html |
| **P0** | LY-03 | `js/components/layout/PageShell.js` + `.css` | โครงหน้ามาตรฐาน: หัวข้อหน้า + พื้นที่เนื้อหา (ทุก Page ใช้ตัวนี้ห่อ) | ทุกหน้ามีระยะขอบ/ความกว้างสูงสุดเหมือนกัน |
| **P0** | PG-01 | `js/pages/HomePage.js` (`#/`) | หน้าแรก: การ์ดเมนู 3 ใบ (ลงทะเบียนรถ / จองที่จอด / ตรวจบัตรและประวัติ) | ประกอบชิ้นงานได้ครบ flow, จัดการ loading/error ให้เห็นผู้ใช้ |
| **P0** | UI-01 | `js/components/ui/Button.js` + `.css` | ปุ่มมาตรฐาน (primary=ส้ม, secondary, ghost) | 3 variant ตาม tokens, มี state loading/disabled, โฟกัสด้วยคีย์บอร์ดเห็นชัด |
| **P0** | UI-02 | `js/components/ui/Card.js` + `.css` | กรอบการ์ดพื้นขาว เงานุ่ม ใช้ห่อเนื้อหาทุกหน้า | ใช้ห่อ component อื่นได้, ไม่ hard-code สี |
| **P0** | UI-03 | `js/components/ui/Field.js` + `.css` | ช่องกรอกข้อมูล + label + ข้อความ error ใต้ช่อง | แสดง error เป็นสีแดงใต้ช่อง, label ผูกกับ input (a11y) |
| **P0** | UI-06 | `js/components/ui/Alert.js` + `.css` | กล่องข้อความแจ้งผลในหน้า (สำเร็จ/ผิดพลาด/ข้อมูล) | มี role=alert สำหรับ error |
| **P1** | UI-05 | `js/components/ui/Badge.js` + `.css` | ป้ายสถานะเล็ก (ว่าง/ติดบางช่วง/เต็ม/ผ่าน/ไม่ผ่าน) | สีมาจาก tokens |
| **P1** | UI-07 | `js/components/ui/Toast.js` + `.css` | ข้อความลอยชั่วคราวมุมจอ | หายเองใน 4 วินาที, ซ้อนหลายอันได้ |
| **P2** | LY-02 | `js/components/layout/AppFooter.js` + `.css` | ท้ายเว็บ ข้อมูลโครงการ/ปีการศึกษา | เรียบง่าย ไม่ชนเนื้อหาบนมือถือ |
| **P2** | UI-04 | `js/components/ui/Chip.js` + `.css` | ปุ่มตัวเลือกทรงเม็ดยา (ใช้เลือกวัน/เวลา/ระยะเวลา) | สถานะ selected/disabled ชัดเจน |
| **P2** | UI-08 | `js/components/ui/Stepper.js` + `.css` | หัวข้อขั้นตอนแบบมีเลข (1 เลือกเวลา → 2 เลือกช่อง → 3 ยืนยัน) | ขั้นที่ผ่านแล้ว/ปัจจุบัน/ยังไม่ถึง แยกสีชัด |
| **P2** | UI-09 | `js/components/ui/Spinner.js` + `.css` | ไอคอนหมุนระหว่างโหลด | มี aria-live ข้อความ 'กำลังโหลด' |
| **P2** | UI-10 | `js/components/ui/EmptyState.js` + `.css` | หน้า/ตารางที่ยังไม่มีข้อมูล | ข้อความไทย อ่านง่าย |

## Dev 2 — เลือกวัน/เวลา + ลงทะเบียนรถ (ตาม sequence diagram)
ทำตัวเลือกวัน-เวลา 3 ชิ้นก่อน (Dev 3 รอไปประกอบหน้าจอง) แล้วค่อยทำหน้าลงทะเบียนรถ

| ระดับ | Ticket | ไฟล์ | หน้าที่ | เกณฑ์ผ่านเพิ่มเติม |
|---|---|---|---|---|
| **P0** | BK-01 | `js/features/booking/DateStrip.js` + `.css` | แถบเลือกวัน 14 วัน (วันนี้ + 13 วันถัดไป ตามโค้ดเก่า) | ใช้ ymd()/thaiDate() จาก core/time.js, เลื่อนแนวนอนได้บนมือถือ |
| **P0** | BK-02 | `js/features/booking/TimeChips.js` + `.css` | ชิปเลือกเวลาเริ่ม ภายในเวลาเปิด-ปิดทำการ | ไม่แสดงเวลานอกเวลาทำการ (ค่าจาก /api/zones) |
| **P0** | BK-03 | `js/features/booking/DurationPicker.js` + `.css` | เลือกระยะเวลา (30 นาที, 1, 2, 3 ชม.) แล้วคำนวณเวลาสิ้นสุด | ปิดตัวเลือกที่ทำให้เกินเวลาปิดทำการ |
| **P0** | PG-02 | `js/pages/VehiclePage.js` (`#/vehicle`) | หน้าลงทะเบียนรถ ตาม sequence: กรอก → verify กับ TU → บันทึก → แสดงผล / Invalid user  (ใช้ VehicleForm, StudentVerifyStatus, VehicleCard, api/vehicles.js) | ประกอบชิ้นงานได้ครบ flow, จัดการ loading/error ให้เห็นผู้ใช้ |
| **P0** | VH-01 | `js/features/vehicle/VehicleForm.js` + `.css` | ฟอร์มกรอกรหัสนักศึกษา, อีเมล มธ., ทะเบียนรถ, จังหวัด | validate รหัส นศ. 10 หลัก, อีเมลลงท้าย @dome.tu.ac.th, ทะเบียนรูปแบบไทย; ปุ่มกดซ้ำไม่ได้ขณะ busy |
| **P0** | VH-02 | `js/features/vehicle/StudentVerifyStatus.js` + `.css` | แสดงสถานะการตรวจกับ TU: idle → กำลังตรวจ → ผ่าน (ชื่อ/คณะ) → Invalid user | ครบ 5 สถานะ ตามแผนภาพ sequence |
| **P0** | VH-04 | `js/api/vehicles.js` | ทำ mock สลับผ่าน/ไม่ผ่านตามรหัส นศ. (บรรทัด 20) ดู contract บรรทัด 1-10 | ตาม contract ในไฟล์ |
| **P1** | VH-03 | `js/features/vehicle/VehicleCard.js` + `.css` | การ์ดแสดงข้อมูลรถที่บันทึกแล้ว | แสดงทะเบียนแบบป้ายรถ อ่านง่าย |

## Dev 3 — ผังช่องจอด + หน้าจอง (งานหลักของ Demo)
ถ้าหน้านี้ไม่เสร็จ Demo ไม่ผ่าน ทำก่อนอย่างอื่นเสมอ

| ระดับ | Ticket | ไฟล์ | หน้าที่ | เกณฑ์ผ่านเพิ่มเติม |
|---|---|---|---|---|
| **P0** | BK-04 | `js/features/booking/ParkingLot.js` + `.css` | ผังลานจอดทั้งหมด วาดทุกโซนในตัวเอง (ไม่ต้องทำ ZoneBlock แยก) | แต่ละโซนมีหัวโซน (ชื่อ + 'ว่าง x/y' หรือป้าย 'เต็ม') ตามโค้ดเก่า parking-lot.js บรรทัด 9-13 และ 77-81; รูปแบบข้อมูลตรงกับ GET /api/zones และ /api/availability (ดู api/mock/*.json) |
| **P0** | BK-06 | `js/features/booking/SlotBay.js` + `.css` | ช่องจอด 1 ช่อง 3 สถานะ: free / partial / booked | ช่องที่ booked ต้อง 'กดได้' ตามเดิม (ให้ Backend เป็นผู้ตัดสิน), มีลายขีดเฉียงแยกสถานะไม่พึ่งสีอย่างเดียว |
| **P0** | BK-07 | `js/features/booking/BookingSummary.js` + `.css` | สรุปก่อนยืนยัน (วัน เวลา ช่อง ทะเบียนรถ) + ปุ่มยืนยัน | ปุ่มยืนยันปิดจนกว่าจะเลือกช่องครบ |
| **P0** | BK-08 | `js/api/zones.js, api/reservations.js (createReservation)` | ตรวจฟังก์ชันที่ PM เขียนไว้ให้ ต่อ API จริงแล้วทดสอบ TC-US7-01..04 | ตาม contract ในไฟล์ |
| **P0** | PG-03 | `js/pages/BookingPage.js` (`#/booking`) | หน้าจอง 3 ขั้น: เลือกวัน-เวลา → เลือกช่อง → ยืนยัน แล้วไป #/ticket/<code>  (ใช้ DateStrip, TimeChips, DurationPicker, ParkingLot, BookingSummary, api/zones.js, api/reservations.js) | ประกอบชิ้นงานได้ครบ flow, จัดการ loading/error ให้เห็นผู้ใช้ |
| **P2** | BK-05 | `js/features/booking/ZoneBlock.js` + `.css` | กลุ่มช่องจอดของ 1 โซน + หัวโซน (ว่าง x/y หรือป้าย 'เต็ม') | หัวโซนขึ้น 'เต็ม' เมื่อ full=true (TC-US7-03) |

## Dev 4 — บัตร QR, ประวัติ, ข้อความ error
ส่วนหลังจากกดจองสำเร็จ + แปลง error เป็นภาษาไทยที่เดียว

| ระดับ | Ticket | ไฟล์ | หน้าที่ | เกณฑ์ผ่านเพิ่มเติม |
|---|---|---|---|---|
| **P0** | ER-01 | `js/api/errors.js` | เติมกรณีเน็ตหลุด (บรรทัด 20) และตรวจว่าครบทุก code | ตาม contract ในไฟล์ |
| **P0** | HS-01 | `js/features/history/ReservationTable.js` + `.css` | ตารางรายการจองล่าสุด | บนมือถือแปลงเป็นการ์ดเรียงลง ไม่ scroll แนวนอน; ว่าง = EmptyState |
| **P0** | PG-04 | `js/pages/TicketPage.js` (`#/ticket/:code`) | หน้าบัตรจอง (โหลดจากรหัสใน URL) + ReservationLookup | ประกอบชิ้นงานได้ครบ flow, จัดการ loading/error ให้เห็นผู้ใช้ |
| **P0** | PG-05 | `js/pages/HistoryPage.js` (`#/history`) | หน้ารายการจองล่าสุด (ReservationTable) | ประกอบชิ้นงานได้ครบ flow, จัดการ loading/error ให้เห็นผู้ใช้ |
| **P0** | TK-01 | `js/features/ticket/TicketCard.js` + `.css` | บัตรจอง: รหัส PK-XXXXXXXX, QR, ช่อง/โซน/วัน/เวลา, ปุ่มบันทึกรูป | QR แสดงชัด พิมพ์/บันทึกรูปได้ (ดูโค้ดเดิม showTicket()) |
| **P0** | TK-03 | `js/api/reservations.js (listReservations/getReservation/qrUrl)` | ตรวจฟังก์ชันที่ PM เขียนไว้ให้ | ตาม contract ในไฟล์ |
| **P1** | TK-02 | `js/features/ticket/ReservationLookup.js` + `.css` | ช่องค้นการจองจากรหัส (ด่านทางเข้า) + แสดงผลพบ/ไม่พบ | รับรหัสพิมพ์เล็กได้ (backend แปลงเป็นตัวใหญ่), ไม่พบแสดงข้อความไทย |

## สคริปต์ Demo ที่ต้องเดินได้ในวันส่ง
1. ลงทะเบียนรถ: รหัส นศ. ปกติ → ผ่าน → บันทึก | รหัสที่ไม่ผ่าน → Invalid user
2. จองช่อง A1 → ได้บัตร QR (TC-US7-01)
3. จอง A1 เวลาเดิมซ้ำ → ช่องนี้ถูกจองแล้ว (TC-US7-02)
4. จอง B1 + B2 → โซน B เต็ม (TC-US7-03)
5. เลือกเวลา 07:00 → นอกเวลาทำการ (TC-US7-04)
6. หน้าประวัติแสดงรายการล่าสุด · (P1) หน้าตรวจบัตรพิมพ์รหัส PK- → พบ/ไม่พบ
