# Feature Specification: Backoffice Audit Log Viewer

**Feature Branch**: `001-backoffice-audit-log`  
**Created**: 2026-05-26  
**Status**: Draft  
**Input**: User description: "ฉันต้องการสร้างหน้าเว็บสำหรับการแสดงข้อมูล Audit log สำหรับ Backoffice"
ป
## Navigation Structure

```
Backoffice
└── LOG REPORT (tab)
    └── REPORT TAB (page)
        ├── View Log Report (sub-tab)  ← กรอกเงื่อนไขและเลือก report
        │   └── [Filter Form]
        │       ├── Report List      : dropdown (12 รายการ, default = 1. Usage Time Per User)
        │       ├── From Period      : text box + calendar icon
        │       ├── To Period        : text box + calendar icon
        │       ├── User Status      : radio — ● All  ○ Enable  ○ Disable
        │       ├── [Submit icon]    : เปิด tab ผลลัพธ์ของ report ที่เลือก
        │       └── [Reset icon]     : ล้างเงื่อนไขทั้งหมด
        ├── Export All (sub-tab)       ← Export ทุก report (1–12) เป็น ZIP
        │   └── [Filter Form]
        │       ├── From Period      : text box + calendar icon
        │       ├── To Period        : text box + calendar icon
        │       ├── User Status      : radio — ● All  ○ Enable  ○ Disable
        │       ├── [Download button]: export reports 1–12 เป็น ZIP file
        │       └── [Reset button]   : ล้างเงื่อนไขทั้งหมด
        │
        └── [Dynamic Report Tabs]      ← เปิดเพิ่มเมื่อ Submit (ชื่อตาม report)
            ├── "11. Failed Login" tab
            │   ├── [Report Header]  Report: 11. Failed Login | Date: {from} to {to}
            │   ├── [Export Icon]    ← export เป็น CSV
            │   └── [Result Table]
            │       └── LOGIN DATETIME | ACTION | ACTION_DESC | USER NAME |
            │           GROUP | ADMINISTRATOR | FIRSTNAME | LASTNAME |
            │           CLIENT IP ADDRESS | CLIENT NAME
            └── "12. Audit Log" tab
                ├── [Report Header]  Report: 12. Audit Log | Date: {from} to {to}
                ├── [Export Icon]    ← export เป็น CSV
                └── [Result Table]
                    └── username | ACTION | ACTION_DATE | ACTION_DESC |
                        RESULT | IP_ADDRESS | UPDATED_DATA | PREVIOUS_DATA | MODIFY_BY
```

### ข้อมูล Data Availability ของแต่ละ Report

| กลุ่ม | Reports | Data Availability | View Log Report (Submit) | Export All (Download) |
|-------|---------|------------------|--------------------------|-----------------------|
| กลุ่ม A | 1–10 | ไม่จำกัด | ค้นหาได้ทุกช่วง | export ได้ทุกช่วง |
| กลุ่ม B | 11–12 | สูงสุด **90 วัน** | **clamp อัตโนมัติ** — ระบบปรับ From Period เป็น current date − 90 วันโดยอัตโนมัติ (ไม่บล็อก) | export เฉพาะข้อมูลที่มี (ไม่บล็อก) |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - เข้าถึง View Log Report และกรอกเงื่อนไข (Priority: P1)

ผู้ดูแลระบบ Backoffice ต้องการเข้าถึงหน้า Audit Log ผ่าน **LOG REPORT tab** และเลือก sub-tab **View Log Report** เพื่อเห็น filter form สำหรับเลือก report และกำหนดเงื่อนไข

**Why this priority**: การเข้าถึงและกรอกเงื่อนไขใน filter form เป็นจุดเริ่มต้นของทุก report ผู้ดูแลระบบต้องผ่านขั้นตอนนี้ก่อนเสมอ

**Independent Test**: ทดสอบโดยคลิก LOG REPORT tab → REPORT TAB → View Log Report แล้วตรวจสอบว่า filter form แสดงครบถ้วนพร้อมใช้งาน

**Acceptance Scenarios**:

1. **Given** ผู้ใช้เข้าสู่ระบบ Backoffice และมีสิทธิ์ดู Audit Log, **When** คลิก LOG REPORT tab, **Then** ระบบแสดงหน้า REPORT TAB พร้อม sub-tab "View Log Report" และ "Export All"
2. **Given** ผู้ใช้อยู่ที่หน้า REPORT TAB, **When** คลิก sub-tab "View Log Report", **Then** ระบบแสดง filter form พร้อมฟิลด์: Report List (dropdown), From Period, To Period, User Status (radio), Submit icon, Reset icon
3. **Given** ผู้ใช้อยู่ที่ sub-tab View Log Report, **When** หน้าโหลดครั้งแรก, **Then** ค่าเริ่มต้น: Report List = "1. Usage Time Per User", From/To Period ว่าง, User Status = "All"

---

### User Story 2 - กรองและค้นหาข้อมูล Audit Log ด้วย Filter Form (Priority: P2)

ผู้ดูแลระบบต้องการใช้ filter form ใน sub-tab **View Log Report** เพื่อกรองข้อมูล Audit Log โดยเลือก Report List, กำหนดช่วงเวลา (From/To Period), กำหนด User Status แล้วกด Submit เพื่อดูผลลัพธ์ หรือกด Reset เพื่อล้างเงื่อนไข

**Why this priority**: Filter form เป็นหัวใจของการค้นหา ข้อมูล Audit Log มีจำนวนมาก ผู้ดูแลระบบต้องสามารถระบุเงื่อนไขได้อย่างถูกต้องเพื่อหาข้อมูลที่ต้องการ

**Independent Test**: เลือก Report List + กำหนด From/To Period + เลือก User Status แล้วกด Submit ตรวจสอบว่าผลลัพธ์ตรงกับทุกเงื่อนไขที่กำหนด

**Acceptance Scenarios**:

1. **Given** ผู้ใช้อยู่ที่ sub-tab View Log Report, **When** หน้าโหลดครั้งแรก, **Then** ระบบแสดง filter form พร้อมค่าเริ่มต้น: Report List ว่าง, From/To Period ว่าง, User Status เลือก "All"
2. **Given** ผู้ใช้เลือก Report List (dropdown) และกด Submit, **When** ระบบค้นหา, **Then** ระบบแสดงเฉพาะรายการที่ตรงกับ report ที่เลือก
3. **Given** ผู้ใช้กำหนด From Period และ To Period แล้วกด Submit, **When** ระบบค้นหา, **Then** ระบบแสดงเฉพาะรายการในช่วงวันที่ที่กำหนด
4. **Given** ผู้ใช้เลือก User Status เป็น "Enable" แล้วกด Submit, **When** ระบบค้นหา, **Then** ระบบแสดงเฉพาะรายการของผู้ใช้ที่มีสถานะ Enable
5. **Given** ผู้ใช้เลือก User Status เป็น "Disable" แล้วกด Submit, **When** ระบบค้นหา, **Then** ระบบแสดงเฉพาะรายการของผู้ใช้ที่มีสถานะ Disable
6. **Given** ผู้ใช้ตั้งเงื่อนไขกรองหลายอย่างพร้อมกัน, **When** กด Submit, **Then** ระบบแสดงผลลัพธ์ที่ตรงกับทุกเงื่อนไขพร้อมกัน
7. **Given** ผู้ใช้ตั้งเงื่อนไขกรองที่ไม่มีผลลัพธ์แล้วกด Submit, **When** ระบบค้นหา, **Then** ระบบแสดงข้อความว่าไม่พบข้อมูลที่ตรงกัน
8. **Given** ผู้ใช้ตั้งเงื่อนไขกรองและดูผลลัพธ์แล้ว, **When** กด Reset, **Then** ระบบล้างค่าใน filter form กลับสู่ค่าเริ่มต้น และ report tabs ที่เปิดอยู่ยังคงแสดงผลลัพธ์เดิมไว้ตามเดิม

---

### User Story 2b - ดูผลลัพธ์ Report ใน Tab แยก (Priority: P2)

ผู้ดูแลระบบเลือก report จาก Report List, กำหนดเงื่อนไข และกด Submit — ระบบเปิด **tab ใหม่ชื่อตาม report** แสดง report header (ชื่อ report + ช่วงวันที่) และตารางผลลัพธ์ สำหรับ Report 11–12 มีข้อจำกัด 90 วัน

**Why this priority**: การเปิด tab แยกช่วยให้ผู้ดูแลระบบเปิดและเปรียบเทียบหลาย report พร้อมกันได้ และ data availability constraint ป้องกันการโหลดข้อมูลมากเกินไป

**Independent Test**: เลือก "11. Failed Login" → กำหนดวันที่ไม่เกิน 90 วัน → กด Submit → ตรวจสอบว่า tab "11. Failed Login" เปิดขึ้น มี header แสดงชื่อ report + ช่วงวันที่ และตารางมีคอลัมน์ครบ 10 คอลัมน์

**Acceptance Scenarios**:

1. **Given** ผู้ใช้เลือก report ใด ๆ กำหนดเงื่อนไข แล้วกด Submit, **When** ระบบประมวลผล, **Then** ระบบเปิด tab ใหม่ชื่อตาม report ที่เลือก และแสดงผลลัพธ์ใน tab นั้น
2. **Given** ผู้ใช้เลือก Report 1–10 และกำหนดช่วงวันที่ใดก็ได้, **When** กด Submit, **Then** ระบบเปิด tab ผลลัพธ์ได้ทันทีโดยไม่มีข้อจำกัดวันที่
3. **Given** ผู้ใช้เลือก "11. Failed Login" หรือ "12. Audit Log" และกำหนดช่วงวันที่ภายใน 90 วัน, **When** กด Submit, **Then** ระบบเปิด tab ผลลัพธ์และแสดงข้อมูลในช่วงนั้น
4. **Given** ผู้ใช้เลือก "11. Failed Login" หรือ "12. Audit Log", **When** เลือก report จาก dropdown, **Then** ระบบ auto-fill From Period = current date − 90 วัน, To Period = current date — ผู้ใช้สามารถปรับเปลี่ยนวันที่ได้ และเมื่อ Submit ระบบจะ clamp fromPeriod เป็น max(fromPeriod, current date − 90) โดยอัตโนมัติ ไม่บล็อก ไม่ error
5. **Given** มี tab ของ report นั้นเปิดอยู่แล้ว, **When** กด Submit ด้วยเงื่อนไขใหม่, **Then** ระบบอัปเดตผลลัพธ์ใน tab เดิม ไม่เปิด tab ซ้ำ
6. **Given** tab "11. Failed Login" เปิดขึ้น, **When** ผู้ใช้ดูหน้า report, **Then** ระบบแสดง report header: "Report: 11. Failed Login" และ "Date: {From Period} to {To Period}" ก่อนตาราง
7. **Given** tab "11. Failed Login" แสดงผลลัพธ์, **When** ผู้ใช้ดูตาราง, **Then** ตารางมีคอลัมน์ครบตามลำดับ: Login Datetime, ACTION, ACTION_DESC, User Name, Group, Administrator, Firstname, Lastname, Client IP Address, Client Name
8. **Given** tab "11. Failed Login" แสดงผลลัพธ์, **When** ผู้ใช้ดูตาราง, **Then** ตารางมีคอลัมน์ครบ 10 คอลัมน์: Login Datetime, ACTION (= "LOGIN"), ACTION_DESC (จาก catalog), User Name, Group, Administrator (Y หรือว่าง), Firstname, Lastname, Client IP Address, Client Name
9. **Given** ผู้ใช้เลือก "12. Audit Log" กำหนดช่วงวันที่ภายใน 90 วัน แล้วกด Submit, **When** ระบบประมวลผล, **Then** ระบบเปิด tab ใหม่ชื่อ "12. Audit Log" พร้อม header (Report + Date) และตาราง 9 คอลัมน์
10. **Given** tab "12. Audit Log" แสดงผลลัพธ์, **When** ผู้ใช้ดูตาราง, **Then** ตารางมีคอลัมน์ครบ 9 คอลัมน์: username, ACTION, ACTION_DATE, ACTION_DESC, RESULT, IP_ADDRESS, UPDATED_DATA, PREVIOUS_DATA, MODIFY_BY
11. **Given** ผู้ใช้อยู่ใน report tab ใด ๆ และตารางมีข้อมูลแสดงอยู่, **When** คลิก export icon, **Then** ระบบดาวน์โหลดไฟล์ CSV ที่มีข้อมูลตรงกับผลลัพธ์ที่แสดงในตาราง

---

### User Story 3 - ดูรายละเอียด Audit Log (Priority: P3)

ผู้ดูแลระบบต้องการดูรายละเอียดเพิ่มเติมของ Audit Log รายการใดรายการหนึ่งใน sub-tab **View Log Report** เพื่อตรวจสอบข้อมูลที่เปลี่ยนแปลงหรือข้อมูลเพิ่มเติม

**Why this priority**: รายละเอียดเพิ่มเติมช่วยให้ผู้ดูแลระบบเข้าใจบริบทของกิจกรรมได้ลึกขึ้น แต่ไม่ใช่ฟังก์ชันหลักที่ต้องใช้ทุกครั้ง

**Independent Test**: คลิกดูรายละเอียดของรายการใดรายการหนึ่ง แล้วตรวจสอบว่าข้อมูลครบถ้วนและถูกต้อง

**Acceptance Scenarios**:

1. **Given** ผู้ใช้อยู่ที่ sub-tab View Log Report และมีรายการแสดงอยู่, **When** คลิกดูรายละเอียดของรายการใดรายการหนึ่ง, **Then** ระบบแสดงข้อมูลรายละเอียดทั้งหมดของรายการนั้น รวมถึงข้อมูลก่อน/หลังการเปลี่ยนแปลง (ถ้ามี)
2. **Given** ผู้ใช้อยู่ที่หน้ารายละเอียด Audit Log, **When** ปิดหรือกลับไปหน้ารายการ, **Then** ระบบกลับไปแสดง sub-tab View Log Report พร้อมกับเงื่อนไขกรองเดิม

---

### User Story 4 - Export ทุก Report เป็น ZIP ผ่าน Export All Tab (Priority: P4)

ผู้ดูแลระบบต้องการ export ข้อมูลจากทุก report (1–12) พร้อมกันผ่าน sub-tab **Export All** โดยกำหนดช่วงวันที่และ User Status แล้วกด **Download** เพื่อรับไฟล์ ZIP ที่ประกอบด้วย CSV ของแต่ละ report

**Why this priority**: Export All ช่วยให้ผู้ดูแลระบบดาวน์โหลดข้อมูลทุก report ในครั้งเดียว สะดวกสำหรับการรายงานหรือส่งต่อข้อมูลภายนอก

**Independent Test**: เปิด Export All tab → กำหนด From/To Period + User Status → กด Download → ตรวจสอบว่าได้รับ ZIP file และภายใน ZIP มีไฟล์ CSV ครบ 12 report

**Acceptance Scenarios**:

1. **Given** ผู้ใช้อยู่ที่หน้า REPORT TAB, **When** คลิก sub-tab "Export All", **Then** ระบบแสดง filter form ประกอบด้วย: From Period, To Period, User Status (radio: All/Enable/Disable), Download button, Reset button
2. **Given** ผู้ใช้กำหนดเงื่อนไขใน Export All แล้วกด Download, **When** ระบบประมวลผล, **Then** ระบบดาวน์โหลด ZIP file ที่ประกอบด้วยไฟล์ CSV ของ report 1–12 ทุกตัว
3. **Given** ผู้ใช้กด Download สำเร็จ, **Then** ระบบแจ้งผลสำเร็จและเริ่มดาวน์โหลด ZIP file ทันที
4. **Given** ผู้ใช้เลือก User Status "Enable", **When** กด Download, **Then** ZIP file มีข้อมูลเฉพาะของผู้ใช้สถานะ Enable เท่านั้น
5. **Given** ผู้ใช้กำหนด From/To Period, **When** กด Download, **Then** ZIP file มีข้อมูลเฉพาะในช่วงวันที่ที่กำหนด
6. **Given** ผู้ใช้กำหนด From Period เกิน 90 วันย้อนหลัง, **When** กด Download, **Then** ระบบ export ได้ปกติ — report 1–10 มีข้อมูลตามที่กำหนด, report 11–12 มีเฉพาะข้อมูลภายใน 90 วันล่าสุด
7. **Given** ผู้ใช้ตั้งเงื่อนไขแล้ว, **When** กด Reset, **Then** ระบบล้างค่า From/To Period กลับเป็นว่าง และ User Status กลับเป็น "All"

---

### Edge Cases

- จะเกิดอะไรขึ้นเมื่อผู้ใช้ไม่มีสิทธิ์เข้าถึง LOG REPORT tab?
- Report List มีค่าเริ่มต้นเป็น Report 1 เสมอ จึงไม่มีกรณีกด Submit โดยไม่มี Report List
- จะเกิดอะไรขึ้นเมื่อเลือก "11. Failed Login" และกำหนดช่วงวันที่เกิน 90 วัน?
- ระบบจะแสดงผลอย่างไรเมื่อผลลัพธ์ของ report tab มีข้อมูลหลายล้านรายการ?
- หากกด Submit ซ้ำในขณะที่ tab report กำลังโหลดอยู่ จะเกิดอะไรขึ้น?
- จะเกิดอะไรขึ้นเมื่อการ export ข้อมูลใน Export All มีข้อมูลมากเกินไป?
- ระบบจะแสดงผลอย่างไรเมื่อ session หมดอายุระหว่างดูข้อมูลใน report tab?
- จะเกิดอะไรขึ้นหาก CATALOG_ID ใน log ไม่ตรงกับรายการใดใน catalog table (9010001–9010010) — ระบบแสดง CATALOG_ID ดิบหรือแสดงว่าง?
- ระบบจะแสดงคอลัมน์ Administrator อย่างไรเมื่อค่าเป็น null — แสดงเป็นช่องว่างหรือ "-"?

## Requirements *(mandatory)*

### Functional Requirements

**Navigation**

- **FR-001**: ระบบต้องแสดง LOG REPORT tab ใน navigation หลักของ Backoffice
- **FR-002**: เมื่อผู้ใช้คลิก LOG REPORT tab ระบบต้องแสดงหน้า REPORT TAB พร้อม sub-tab 2 รายการ: "View Log Report" และ "Export All"
- **FR-003**: ระบบต้องแสดง sub-tab ที่ active อยู่อย่างชัดเจน และผู้ใช้สามารถสลับระหว่าง sub-tab ได้

**View Log Report (sub-tab) — Filter Form**

- **FR-004**: ระบบต้องแสดง filter form ที่ประกอบด้วยฟิลด์ครบถ้วน: Report List, From Period, To Period, User Status, Submit, Reset โดยมีค่าเริ่มต้น: **Report List = "1. Usage Time Per User"**, From Period = ว่าง, To Period = ว่าง, User Status = "All"
- **FR-005**: ฟิลด์ **Report List** ต้องเป็น dropdown แสดงรายชื่อ report ทั้งหมด 12 รายการตามลำดับ:
  1. Usage Time Per User
  2. Total Usage User Per Day
  3. Usage By Module
  4. Usage Report By Hour
  5. User Not Login
  6. Update Data
  7. Last Login 3 Months
  8. Current User in System
  9. Last Login
  10. Successfully Login
  11. Failed Login
  12. Audit Log
- **FR-006**: ฟิลด์ **From Period** และ **To Period** ต้องเป็น text box ที่ผู้ใช้พิมพ์วันที่ได้โดยตรง และมี calendar icon ให้คลิกเพื่อเลือกวันที่จาก date picker — รูปแบบวันที่ที่รับและแสดงผลคือ **`YYYY-MM-DD`** (ISO 8601) ระบบเก็บ timestamp แบบเต็มในรูปแบบ `YYYY-MM-DD HH:MM:SS.ms`
- **FR-007**: ฟิลด์ **User Status** ต้องเป็น radio button 3 ตัวเลือก: "All" (ค่าเริ่มต้น), "Enable", "Disable" — กรองตามสถานะของผู้ใช้ที่กระทำกิจกรรม
- **FR-008**: ปุ่ม **Submit** (icon) เมื่อคลิกต้องเปิด tab ใหม่ชื่อตาม report ที่เลือก (เช่น "11. Failed Login") และแสดงผลลัพธ์ใน tab นั้น — ปุ่ม Submit ต้อง **disable** ขณะที่ระบบกำลังโหลดข้อมูล และ enable กลับเมื่อ request เสร็จสมบูรณ์
- **FR-009**: หาก tab ของ report นั้นเปิดอยู่แล้ว ระบบต้องอัปเดตผลลัพธ์ใน tab เดิม แทนการเปิด tab ซ้ำ
- **FR-010**: ปุ่ม **Reset** (icon) เมื่อคลิกต้องล้างค่าใน filter form ทั้งหมดกลับสู่ค่าเริ่มต้น (Report List ว่าง, From/To Period ว่าง, User Status = All) — report tabs ที่เปิดอยู่แล้วยังคงแสดงผลลัพธ์เดิมไว้ ไม่ถูกปิดหรือ refresh
- **FR-011**: ระบบต้องแสดง validation หาก From Period มากกว่า To Period และไม่ดำเนินการ

**View Log Report — Data Availability Constraints**

- **FR-012**: ขีดจำกัด data availability แบ่งตามกลุ่ม report:
  - **Report 1–10** (Usage Time Per User ถึง Successfully Login): ไม่มีขีดจำกัด — ค้นหาย้อนหลังได้ไม่จำกัด
  - **Report 11** (Failed Login) และ **Report 12** (Audit Log): ข้อมูลย้อนหลังสูงสุด **90 วัน** — ระบบ **clamp อัตโนมัติ**: เมื่อผู้ใช้เลือก Report 11 หรือ 12 ระบบจะปรับ From Period เป็น current date − 90 วันและ To Period เป็น current date โดยอัตโนมัติ และเมื่อ Submit ระบบจะ clamp fromPeriod เป็น max(fromPeriod, current date − 90) ก่อน query โดยไม่บล็อกและไม่แสดง error

**View Log Report — Report Tab (ผลลัพธ์)**

- **FR-013**: ระบบต้องแสดงผลลัพธ์ของแต่ละ report ใน tab แยก โดย tab ชื่อตรงกับรายการใน Report List เช่น "11. Failed Login"
- **FR-014**: ทุก report tab ต้องแสดง **report header** ก่อนตาราง ประกอบด้วย:
  - **Report**: ชื่อ report ที่เลือก
  - **Date**: ช่วงวันที่ที่กรอง (From Period to To Period)
- **FR-015**: tab ผลลัพธ์ต้องแสดงข้อมูลในรูปแบบตารางพร้อม pagination
- **FR-016**: ระบบต้องแสดงจำนวนรายการทั้งหมดที่พบใน tab ผลลัพธ์

**Report 1–10 — Column Specification**

- **FR-017-note**: Reports 1–10 แต่ละตัวมี column specification เฉพาะของตัวเอง (ไม่ใช่ common schema) — column definitions จะถูก specify ใน spec.md นี้ (เหมือน report 11–12) แต่ implementation อยู่ใน **phase แยก** (ไม่ใช่ phase เดียวกับ report 11–12)

**Report 11. Failed Login — Column Specification**

- **FR-017**: tab "11. Failed Login" ต้องแสดงตารางผลลัพธ์ที่มีคอลัมน์ครบ **10 คอลัมน์** ตามลำดับ:

  | ลำดับ | ชื่อคอลัมน์ | ค่าที่แสดง | หมายเหตุ |
  |-------|------------|-----------|----------|
  | 1 | LOGIN DATETIME | วันที่และเวลาที่ login ล้มเหลว | — |
  | 2 | ACTION | `LOGIN` | แสดงค่า **"LOGIN"** เสมอ — report นี้กรองเฉพาะ LOGIN ที่ล้มเหลว |
  | 3 | ACTION_DESC | ข้อความจาก catalog table | ดึงค่า NAME_EN ตาม CATALOG_ID (ดูรายการด้านล่าง) |
  | 4 | USER NAME | ชื่อผู้ใช้ที่พยายาม login | — |
  | 5 | GROUP | กลุ่มของผู้ใช้ | — |
  | 6 | ADMINISTRATOR | `null` หรือ `Y` | null = ไม่ใช่ admin, `Y` = เป็น admin |
  | 7 | FIRSTNAME | ชื่อจริงของผู้ใช้ | — |
  | 8 | LASTNAME | นามสกุลของผู้ใช้ | — |
  | 9 | CLIENT IP ADDRESS | IP Address ของ client ที่ login | — |
  | 10 | CLIENT NAME | ชื่อเครื่อง client | — |

- **FR-017a**: คอลัมน์ **ACTION** ของ report "11. Failed Login" ต้องแสดงค่า **`LOGIN`** เสมอสำหรับทุกแถว — report นี้คือ LOGIN event ที่ไม่สำเร็จ ไม่ใช่ event ประเภทอื่น

- **FR-017b**: คอลัมน์ **ACTION_DESC** ต้องดึงค่า `NAME_EN` จาก **catalog table** ตาม CATALOG_ID และต้องไม่เป็น null เสมอ — หาก CATALOG_ID ไม่พบในตาราง catalog ให้แสดง CATALOG_ID ดิบแทน (เช่น `"9010099"`) โดยมีรายการ catalog ที่ใช้ดังนี้:

  | CATALOG_ID | NAME_EN (ACTION_DESC ที่แสดง) |
  |------------|-------------------------------|
  | 9010001 | User is disabled ! |
  | 9010002 | Password expired. |
  | 9010003 | Password expired. User is disabled. |
  | 9010004 | The password must be changed before logon. | 
  | 9010005 | Over limit this user connection. |
  | 9010006 | Over limit system concurrent. |
  | 9010007 | Too many users are created. |
  | 9010008 | You cannot access system at this time. |
  | 9010009 | Invalid Username or Password |
  | 9010010 | Password will expire in |

- **FR-017c**: คอลัมน์ **ADMINISTRATOR** แสดงได้ 2 ค่าเท่านั้น: **`Y`** (ผู้ใช้นั้นเป็น Administrator) หรือ **ว่าง/null** (ไม่ใช่ Administrator) — ห้ามแสดงค่าอื่น

**Report 12. Audit Log — Column Specification**

- **FR-017d**: tab "12. Audit Log" ต้องแสดงตารางผลลัพธ์ที่มีคอลัมน์ครบ **9 คอลัมน์** ตามลำดับ:

  | ลำดับ | ชื่อคอลัมน์ | คำอธิบาย |
  |-------|------------|----------|
  | 1 | USERNAME | username ของผู้ใช้ที่ถูกกระทำ (เป้าหมายของ action) |
  | 2 | ACTION | ประเภทของ action ที่กระทำ (เช่น UPDATE, CREATE, DELETE) |
  | 3 | ACTION_DATE | วันที่และเวลาที่ action เกิดขึ้น |
  | 4 | ACTION_DESC | คำอธิบายของ action |
  | 5 | RESULT | ผลลัพธ์ของ action (สำเร็จ/ล้มเหลว) |
  | 6 | IP_ADDRESS | IP Address ของผู้ที่กระทำ action |
  | 7 | UPDATED_DATA | ข้อมูลหลังจากถูกเปลี่ยนแปลง |
  | 8 | PREVIOUS_DATA | ข้อมูลก่อนถูกเปลี่ยนแปลง |
  | 9 | MODIFY_BY | username ของผู้ที่กระทำ action (ผู้แก้ไข) |

- **FR-017e**: คอลัมน์ **USERNAME** หมายถึง username ของผู้ใช้ที่เป็น **เป้าหมาย** ของการกระทำ — แตกต่างจาก MODIFY_BY ซึ่งคือผู้ที่ดำเนินการ
- **FR-017f**: คอลัมน์ **UPDATED_DATA** และ **PREVIOUS_DATA** แสดงข้อมูลที่เปลี่ยนแปลง — อาจเป็นค่าว่างสำหรับ action ที่ไม่มีการแก้ไขข้อมูล
- **FR-017g**: Report "12. Audit Log" ต้อง **ไม่แสดง** รายการที่มีค่า ACTION เป็น `VIEW`, `LOGIN`, หรือ `LOGOUT` — รายการเหล่านี้ถูกกรองออกทั้งใน query result และ CSV export

**Report Tab — Export Icon (ทุก report tab)**

- **FR-018**: ทุก report tab ต้องมี **export icon** ที่ผู้ใช้คลิกเพื่อ export ข้อมูลที่แสดงอยู่ใน tab นั้นเป็นไฟล์ **CSV**
- **FR-019**: ไฟล์ CSV ที่ export จาก report tab ต้องมีข้อมูลตรงกับผลลัพธ์ที่แสดงในตาราง (ตามเงื่อนไขที่กรองไว้)
- **FR-020**: ระบบต้องแจ้งสถานะการ export จาก report tab ให้ผู้ใช้ทราบ (กำลังดำเนินการ / สำเร็จ / ล้มเหลว)

**Export All (sub-tab)**

- **FR-021**: ระบบต้องแสดง filter form ใน sub-tab "Export All" ประกอบด้วย: From Period (text box + calendar icon), To Period (text box + calendar icon), User Status (radio: All/Enable/Disable), Download button, Reset button
- **FR-022**: ปุ่ม **Download** เมื่อคลิกต้อง export ข้อมูลของ **report 1–12 ทุกตัว** ตามเงื่อนไขที่กำหนด แล้วแพ็กเป็นไฟล์ **ZIP** ที่ประกอบด้วย CSV แยกของแต่ละ report
- **FR-023**: ระบบต้องแจ้งสถานะการ export ให้ผู้ใช้ทราบ (กำลังดำเนินการ / สำเร็จ / ล้มเหลว) — หาก export ล้มเหลวหรือ timeout ระบบต้องแสดง error message ที่ชัดเจนและให้ผู้ใช้ retry ได้ (synchronous fail-fast — ไม่ใช้ background job)
- **FR-023a**: ปุ่ม **Reset** ใน Export All ต้องล้างค่า From/To Period กลับเป็นว่าง และ User Status กลับเป็น "All"
- **FR-023b**: filter ใน Export All (From/To Period, User Status) ต้องถูก apply กับทุก report ใน ZIP file เหมือนกัน
- **FR-023c**: ขีดจำกัดข้อมูลสำหรับ Export All:
  - **Report 1–10**: ไม่มีขีดจำกัดวันที่ — export ข้อมูลตามช่วงที่กำหนด
  - **Report 11–12**: ข้อมูลมีให้ย้อนหลังสูงสุด 90 วัน (current date − 90) — หาก From Period ที่กำหนดเกินกว่า 90 วัน ระบบ **export เฉพาะข้อมูลที่มีอยู่** ภายใน 90 วัน โดยไม่บล็อก Download

**Access Control**

- **FR-024**: ระบบต้องตรวจสอบสิทธิ์ก่อนแสดง LOG REPORT tab — เฉพาะ **username ที่ได้รับสิทธิ์** เท่านั้นจึงจะเข้าถึงได้ (permission กำหนดระดับ user ไม่ใช่ role)
- **FR-025**: ผู้ดูแลระบบต้องสามารถกำหนด/ยกเลิกสิทธิ์การเข้าถึง LOG REPORT tab ให้กับ username ที่ต้องการได้
- **FR-026**: ผู้ใช้ที่ไม่มีสิทธิ์จะต้องไม่เห็น LOG REPORT tab ใน navigation หรือถูก redirect กลับหากพยายามเข้าถึง URL โดยตรง

### Key Entities *(include if feature involves data)*

- **Audit Log Entry**: บันทึกกิจกรรมแต่ละรายการ ประกอบด้วย: ID, วันที่/เวลา, ชื่อผู้ใช้ (actor), สถานะผู้ใช้ (Enable/Disable), ประเภทกิจกรรม, ชื่อ report/module ที่เกี่ยวข้อง, รายละเอียด, ข้อมูลก่อน/หลังเปลี่ยนแปลง, IP Address, สถานะ (success/failure)
- **Report List Item**: รายการใน dropdown Report List — มี 12 ประเภทได้แก่: Usage Time Per User, Total Usage User Per Day, Usage By Module, Usage Report By Hour, User Not Login, Update Data, Last Login 3 Months, Current User in System, Last Login, Successfully Login, Failed Login, Audit Log
- **User**: ผู้ใช้งานในระบบ Backoffice มีสถานะ Enable/Disable และมี flag สิทธิ์เข้าถึง LOG REPORT แยกต่างหากระดับ username
- **Action Catalog**: ตาราง catalog ที่เก็บรายการ CATALOG_ID และ NAME_EN ของสาเหตุ login ล้มเหลว (9010001–9010010) — ใช้ lookup แสดงค่าใน ACTION_DESC ของ report "11. Failed Login"
- **Filter Criteria**: เงื่อนไขการค้นหาใน View Log Report ประกอบด้วย: Report List, From Period, To Period, User Status

## Clarifications

### Session 2026-06-04

- Q: Report 12 (Audit Log) ควร exclude ACTION ประเภทใดบ้าง? → A: ไม่แสดงรายการที่ ACTION = `VIEW`, `LOGIN`, หรือ `LOGOUT` — กรองออกทั้งใน query และ export (FR-017g)
- Q: พฤติกรรมของ Report 11–12 เมื่อช่วงวันที่เกิน 90 วัน ใน View Log Report ควรเป็นอย่างไร? → A: clamp อัตโนมัติ — เมื่อเลือก Report 11 หรือ 12 ให้ auto-fill From Period = current date − 90 วัน, To Period = current date และเมื่อ Submit ให้ clamp fromPeriod เป็น max(fromPeriod, current date − 90) โดยไม่บล็อกและไม่แสดง error (เหมือนพฤติกรรมของ Export All)

### Session 2026-05-29

- Q: รูปแบบวันที่สำหรับ From Period และ To Period คืออะไร? → A: `YYYY-MM-DD` (ISO 8601) สำหรับ input — ระบบเก็บ timestamp แบบเต็มในรูปแบบ `YYYY-MM-DD HH:MM:SS.ms`
- Q: หาก CATALOG_ID ใน log ไม่ตรงกับรายการใดใน catalog table (9010001–9010010) ระบบควรแสดงอะไรใน ACTION_DESC? → A: ACTION_DESC ต้องไม่เป็น null เสมอ — หาก CATALOG_ID ไม่พบใน catalog ให้แสดง CATALOG_ID ดิบแทน
- Q: หากผู้ใช้กด Submit ซ้ำขณะ report tab กำลังโหลดอยู่ ระบบควรทำอะไร? → A: Disable ปุ่ม Submit ขณะโหลด — ผู้ใช้กดซ้ำไม่ได้จนกว่า request จะเสร็จสมบูรณ์
- Q: หาก Export All มีข้อมูลมากเกินไปหรือ timeout ระบบควรทำอะไร? → A: แสดง error message และให้ผู้ใช้ retry (synchronous, fail-fast — ไม่ใช้ background job)
- Q: Reports 1–10 column specifications อยู่ใน scope ของ branch นี้หรือไม่? → A: Specify column definitions ใน branch นี้ก่อน แต่ implement แยก phase (column specs เพิ่มใน spec.md นี้, implementation แยก phase)

### Session 2026-05-26

- Q: Reports 1–10 มี column specification อย่างไร — แต่ละตัวมี columns เฉพาะ, ใช้ schema ร่วมกัน, หรือ out-of-scope? → A: แต่ละ report (1–10) มี columns เฉพาะของตัวเอง จะ specify ทีละตัวเหมือน report 11–12
- Q: พฤติกรรมของปุ่ม Reset — ล้าง form อย่างเดียว, ล้าง form + keep tabs, หรือ ล้าง form + trigger search ใหม่? → A: ล้าง form กลับค่าเริ่มต้น แต่ keep report tabs ที่เปิดอยู่ไว้ตามเดิม (ไม่ trigger search)
- Q: ค่าเริ่มต้นของ filter form และพฤติกรรม Submit เมื่อไม่ได้เลือก Report List? → A: Report List เลือก Report 1 (Usage Time Per User) เป็นค่าเริ่มต้น, From/To Period = null, User Status = All — Submit พร้อมใช้งานได้ทันทีเพราะ Report List มีค่าเสมอ
- Q: Export All tab มี columns อะไรและ export format คืออะไร? → A: Export All มี filter form เฉพาะ (From/To Period + User Status) และ Download button — เมื่อกด Download จะ export reports 1–12 ทั้งหมดเป็น ZIP file (แต่ละ report เป็น CSV แยก) — มีปุ่ม Reset สำหรับล้าง filter
- Q: Export All ใช้ขีดจำกัด 90 วันของ report 11–12 อย่างไร — บล็อก, export เท่าที่มี, หรือแจ้งเตือน? → A: Reports 1–10 ไม่มีขีดจำกัด, Reports 11–12 มีข้อมูลย้อนหลังสูงสุด 90 วัน (current date - 90) — หาก period เกิน 90 วัน ระบบ export เฉพาะข้อมูลที่มีอยู่ ไม่บล็อก Download

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: ผู้ดูแลระบบสามารถเปิดหน้า Audit Log และเห็นรายการข้อมูลได้ภายใน 3 วินาที แม้มีข้อมูลในระบบมากกว่า 100,000 รายการ
- **SC-002**: ผู้ดูแลระบบสามารถกรองและค้นหาข้อมูลที่ต้องการได้ภายใน 2 นาที โดยไม่ต้องได้รับความช่วยเหลือ
- **SC-003**: ผลลัพธ์การค้นหา/กรองแสดงได้ถูกต้อง 100% ตรงกับเงื่อนไขที่กำหนด
- **SC-004**: ผู้ใช้ที่ไม่มีสิทธิ์ไม่สามารถเข้าถึงหน้า Audit Log ได้ในทุกกรณี (0% unauthorized access)
- **SC-005**: ไฟล์ที่ export ได้มีข้อมูลครบถ้วนและถูกต้องตรงกับข้อมูลที่แสดงในหน้าเว็บ 100%

## Assumptions

- ผู้ใช้งานหลักคือผู้ดูแลระบบ Backoffice ที่มีความรู้พื้นฐานในการใช้งานคอมพิวเตอร์
- ระบบ Backoffice มี navigation bar / tab bar หลักอยู่แล้ว และ LOG REPORT จะเป็น tab ใหม่ที่เพิ่มเข้าไป
- ระบบ Backoffice มีระบบ Authentication อยู่แล้ว และมีกลไกกำหนดสิทธิ์ระดับ username ที่ฟีเจอร์นี้จะใช้งาน
- การกำหนดสิทธิ์เข้าถึง LOG REPORT tab ทำโดยการระบุ username แต่ละคน ไม่ได้ใช้ Role-based access control
- ข้อมูล Audit Log ถูกบันทึกโดยระบบอื่น และหน้านี้มีหน้าที่เฉพาะการแสดงผลเท่านั้น (read-only)
- ฟีเจอร์นี้เป็นส่วนหนึ่งของระบบ Backoffice ที่มีอยู่แล้ว ไม่ได้สร้างระบบใหม่ทั้งหมด
- ข้อมูลใน Audit Log ไม่สามารถแก้ไขหรือลบได้จากหน้าเว็บนี้ (immutable records)
- "Export All" หมายถึงการ export ข้อมูลของ report 1–12 ทุกตัวพร้อมกันเป็น ZIP file — มี filter form แยกของตัวเอง (From/To Period, User Status) ไม่เกี่ยวกับ filter ของ View Log Report
- ZIP file ที่ได้จาก Export All ประกอบด้วยไฟล์ CSV แยกของแต่ละ report (12 files)
- ระบบรองรับการใช้งานบน desktop browser เป็นหลัก (mobile เป็น nice-to-have)
