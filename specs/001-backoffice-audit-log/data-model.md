# Data Model: Backoffice Audit Log Viewer

**Branch**: `001-backoffice-audit-log` | **Date**: 2026-06-02

---

## Entities

### 1. AuditLogEntry — Report 11: Failed Login

Represents a failed login event from the log table.

| Field | Type | Source Column | Notes |
|-------|------|---------------|-------|
| `login_datetime` | TIMESTAMP | `LOGIN_DATETIME` | วันที่/เวลาที่ login ล้มเหลว |
| `action` | VARCHAR | — | Fixed value: `"LOGIN"` (always, per FR-017a) |
| `action_desc` | VARCHAR | `CATALOG_ID` → lookup | `COALESCE(catalog.name_en, CAST(catalog_id AS VARCHAR))` — never null (FR-017b) |
| `catalog_id` | VARCHAR | `CATALOG_ID` | Raw ID used for catalog lookup |
| `user_name` | VARCHAR | `USER_NAME` | ชื่อผู้ใช้ที่พยายาม login |
| `group_name` | VARCHAR | `GROUP_NAME` | กลุ่มของผู้ใช้ |
| `is_administrator` | VARCHAR | `ADMINISTRATOR` | `"Y"` หรือ `""` (empty string) — ห้าม null แสดงในหน้าจอ (FR-017c) |
| `firstname` | VARCHAR | `FIRSTNAME` | ชื่อจริง |
| `lastname` | VARCHAR | `LASTNAME` | นามสกุล |
| `client_ip` | VARCHAR | `CLIENT_IP_ADDRESS` | IP address ของ client |
| `client_name` | VARCHAR | `CLIENT_NAME` | ชื่อเครื่อง client |
| `user_status` | VARCHAR | `USER_STATUS` | ใช้สำหรับ filter — `"Enable"` หรือ `"Disable"` |

**Filter fields**: `login_datetime` (range), `user_status`  
**90-day constraint**: ใช้กับ report นี้ทั้งใน View Log Report (block) และ Export All (clamp)

---

### 2. AuditLogEntry — Report 12: Audit Log

Represents a data modification / action event from the audit log table.

| Field | Type | Source Column | Notes |
|-------|------|---------------|-------|
| `username` | VARCHAR | `USERNAME` | เป้าหมายของ action (ผู้ถูกกระทำ) — ≠ MODIFY_BY (FR-017e) |
| `action` | VARCHAR | `ACTION` | ประเภท action เช่น UPDATE, CREATE, DELETE |
| `action_date` | TIMESTAMP | `ACTION_DATE` | วันที่/เวลาที่ action เกิดขึ้น |
| `action_desc` | VARCHAR | `ACTION_DESC` | คำอธิบาย action |
| `result` | VARCHAR | `RESULT` | สำเร็จ / ล้มเหลว |
| `ip_address` | VARCHAR | `IP_ADDRESS` | IP Address ของผู้ดำเนินการ |
| `updated_data` | TEXT | `UPDATED_DATA` | ข้อมูลหลังเปลี่ยนแปลง — nullable (FR-017f) |
| `previous_data` | TEXT | `PREVIOUS_DATA` | ข้อมูลก่อนเปลี่ยนแปลง — nullable (FR-017f) |
| `modify_by` | VARCHAR | `MODIFY_BY` | username ของผู้ดำเนินการ (ผู้แก้ไข) |
| `user_status` | VARCHAR | `USER_STATUS` | ใช้สำหรับ filter — `"Enable"` หรือ `"Disable"` |

**Filter fields**: `action_date` (range), `user_status`  
**90-day constraint**: ใช้กับ report นี้ทั้งใน View Log Report (block) และ Export All (clamp)

---

### 3. ActionCatalog

Lookup table สำหรับ ACTION_DESC ของ Report 11.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `catalog_id` | VARCHAR | PRIMARY KEY | `9010001`–`9010010` |
| `name_en` | VARCHAR | NOT NULL | ข้อความ action description (English) |

**Known rows**:

| catalog_id | name_en |
|------------|---------|
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

---

### 4. User

ผู้ใช้งานในระบบ Backoffice.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `username` | VARCHAR | PRIMARY KEY | username สำหรับ login |
| `status` | ENUM | NOT NULL | `"Enable"` หรือ `"Disable"` |
| `has_audit_log_access` | BOOLEAN | NOT NULL | สิทธิ์เข้าถึง LOG REPORT tab (FR-024, FR-025) |
| `firstname` | VARCHAR | | ชื่อจริง |
| `lastname` | VARCHAR | | นามสกุล |

**Permission rules**:
- `has_audit_log_access = true` → เห็นและเข้าถึง LOG REPORT tab ได้
- `has_audit_log_access = false` → ไม่เห็น tab และถูก redirect หากเข้า URL ตรง (FR-026)
- การกำหนดสิทธิ์เป็นระดับ username ไม่ใช่ role (FR-024)

---

### 5. FilterCriteria (DTO — ไม่ได้บันทึกใน DB)

เงื่อนไขการค้นหาที่ส่งจาก UI ไปยัง API.

| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| `report_id` | INT | 1–12 | report ที่เลือก |
| `from_period` | DATE | `YYYY-MM-DD`, ≤ to_period | จาก FR-006, FR-011 |
| `to_period` | DATE | `YYYY-MM-DD`, ≥ from_period | จาก FR-006, FR-011 |
| `user_status` | ENUM | `"All"` \| `"Enable"` \| `"Disable"` | default `"All"` |
| `page` | INT | ≥ 1 | สำหรับ pagination |
| `page_size` | INT | default 50 | จำนวนรายการต่อหน้า |

**Business rule**: ถ้า `report_id` ∈ {11, 12} และ `(to_period − from_period) > 90 วัน` → reject ด้วย validation error (View Log Report) หรือ clamp (Export All)

---

### 6. Reports 1–10 (Column specs — Pending)

Column specifications สำหรับ Reports 1–10 จะถูกเพิ่มใน spec.md และ data-model.md ใน phase แยก (FR-017-note, clarification Q5 2026-06-02).

**Placeholder**: แต่ละ report (1–10) มี column specification เฉพาะของตัวเอง — ไม่ใช่ common schema.

---

## Entity Relationships

```
User ─── has_audit_log_access ──► LOG REPORT access
                                        │
                              ┌─────────┴──────────┐
                         View Log Report        Export All
                              │                      │
                         FilterCriteria ──► FilterCriteria (separate)
                              │
                    ┌─────────┴──────────┐
               Report 11             Report 12
          AuditLogEntry           AuditLogEntry
          (Failed Login)          (Audit Log)
                │
          ActionCatalog
          (CATALOG_ID lookup)
```

---

## Data Availability Rules

| Report Group | View Log Report | Export All |
|---|---|---|
| Reports 1–10 | ไม่จำกัด | ไม่จำกัด |
| Reports 11–12 | บล็อกถ้า > 90 วัน | clamp ข้อมูลเป็น 90 วันล่าสุด |
