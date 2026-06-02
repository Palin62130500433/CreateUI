# Tasks: Backoffice Audit Log Viewer

**Input**: Design documents from `specs/001-backoffice-audit-log/`  
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/api-contracts.md ✓, quickstart.md ✓

> **Path note**: Paths use `backend/src/` and `frontend/src/` as logical prefixes from plan.md.  
> Adjust to the actual Backoffice directory structure before implementation (see quickstart.md prerequisites).

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no incomplete task dependencies)
- **[Story]**: User story label — US1/US2/US2b/US3/US4

---

## Phase 1: Setup (Infrastructure Review & Bootstrap)

**Purpose**: Establish the integration points with the existing Backoffice system before any feature code is written.

- [ ] T001 Map logical table names from data-model.md to real DB table names (confirm `failed_login_log`, `audit_log`, `action_catalog`, `users` equivalents with platform team) and document in `specs/001-backoffice-audit-log/research.md` under a new "Table Name Mapping" section
- [ ] T002 Add `has_audit_log_access` boolean column (default `false`) to the existing users table — write migration script in `backend/src/migrations/add_audit_log_access_permission.sql`
- [ ] T003 [P] Create backend AuditLog module directory structure per plan.md: `backend/src/models/AuditLog/`, `backend/src/repositories/AuditLog/`, `backend/src/services/AuditLog/`, `backend/src/api/AuditLog/`
- [ ] T004 [P] Create frontend AuditLog module directory structure per plan.md: `frontend/src/components/AuditLogPage/`, `frontend/src/components/ViewLogReport/`, `frontend/src/components/ExportAllForm/`, `frontend/src/components/ReportTab/`, `frontend/src/components/DataTable/`, `frontend/src/services/auditLogApi/`, `frontend/src/services/exportService/`, `frontend/src/pages/AuditLog/`

**Checkpoint**: Directory structure ready and DB migration applied — feature code can now be added to the existing system

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core backend infrastructure that ALL user stories depend on. Must complete before any user story implementation.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T005 Implement `ActionCatalogRepository` in `backend/src/repositories/AuditLog/ActionCatalogRepository` — method: `lookupActionDesc(catalogId: string): string` using `LEFT JOIN` + `COALESCE(catalog.name_en, CAST(catalog_id AS VARCHAR))` to ensure ACTION_DESC is never null (FR-017b, research.md §6)
- [ ] T006 [P] Implement `FilterCriteria` DTO in `backend/src/models/AuditLog/FilterCriteria` with fields: `reportId (1-12)`, `fromPeriod (YYYY-MM-DD)`, `toPeriod (YYYY-MM-DD)`, `userStatus (All|Enable|Disable)`, `page (default 1)`, `pageSize (default 50)` — include validation method: from ≤ to (FR-011), 90-day check for reportId 11/12 (FR-012)
- [ ] T007 [P] Implement `UserPermissionRepository` in `backend/src/repositories/AuditLog/UserPermissionRepository` — methods: `hasAuditLogAccess(username: string): boolean`, `setAuditLogAccess(username: string, hasAccess: boolean): void` — reads/writes `has_audit_log_access` column from T002 migration
- [ ] T008 Implement `AuditLogRepository` base query builder in `backend/src/repositories/AuditLog/AuditLogRepository` — applies `FilterCriteria` (date range expansion to `00:00:00.000`–`23:59:59.999`, `userStatus` filter), cursor-based pagination returning `{ data, totalCount, page, pageSize }` (research.md §2, data-model.md)

**Checkpoint**: Foundational repositories and DTOs ready — user story implementation can begin

---

## Phase 3: User Story 1 - Navigation & Filter Form Display (Priority: P1) 🎯 MVP

**Goal**: ผู้ดูแลระบบเข้าถึง LOG REPORT tab → REPORT TAB → View Log Report sub-tab เห็น filter form พร้อมค่าเริ่มต้นครบถ้วน

**Independent Test**: คลิก LOG REPORT tab → คลิก View Log Report sub-tab → ตรวจสอบ: Report List = "1. Usage Time Per User", From/To Period = ว่าง, User Status = "All", Submit icon และ Reset icon แสดงครบ

### Implementation for User Story 1

- [ ] T009 [US1] Implement `GET /api/audit-log/access` endpoint in `backend/src/api/AuditLog/AuditLogController` — calls `UserPermissionRepository.hasAuditLogAccess(currentUser)`, returns `{ "hasAccess": true/false }`, returns 403 if session invalid (contracts/api-contracts.md §1)
- [ ] T010 [P] [US1] Implement `GET /api/audit-log/reports` endpoint in `backend/src/api/AuditLog/AuditLogController` — returns static list of 12 reports with `{ id, name, maxDays }` per contracts/api-contracts.md §2 (maxDays: null for 1–10, 90 for 11–12)
- [ ] T011 [P] [US1] Implement `GET /api/audit-log/permissions/{username}` endpoint in `backend/src/api/AuditLog/AuditLogController` — admin use: returns `{ username, hasAuditLogAccess }` via `UserPermissionRepository` (FR-025, contracts/api-contracts.md §6)
- [ ] T012 [P] [US1] Implement `PUT /api/audit-log/permissions/{username}` endpoint in `backend/src/api/AuditLog/AuditLogController` — admin use: updates `has_audit_log_access` via `UserPermissionRepository`, returns updated state (FR-025, contracts/api-contracts.md §7)
- [ ] T013 [US1] Add LOG REPORT tab to existing Backoffice navigation in `frontend/src/components/AuditLogPage/` — call `GET /api/audit-log/access` on app load; show tab only if `hasAccess: true`; hide tab (do not render) if `hasAccess: false` (FR-001, FR-024)
- [ ] T014 [P] [US1] Implement navigation guard in `frontend/src/pages/AuditLog/` — intercept direct URL access to LOG REPORT routes; redirect to home/login if `GET /api/audit-log/access` returns `hasAccess: false` or 403 (FR-026)
- [ ] T015 [US1] Build REPORT TAB page with sub-tab navigation in `frontend/src/pages/AuditLog/` — renders "View Log Report" and "Export All" sub-tabs; highlights active sub-tab; allows switching between sub-tabs (FR-002, FR-003)
- [ ] T016 [P] [US1] Build View Log Report filter form component in `frontend/src/components/ViewLogReport/FilterForm` — fields: Report List (dropdown, 12 items from API), From Period (text + calendar icon, YYYY-MM-DD), To Period (text + calendar icon, YYYY-MM-DD), User Status (radio: All/Enable/Disable), Submit icon, Reset icon; defaults: Report List = item 1, From/To = empty, User Status = "All" (FR-004, FR-005, FR-006, FR-007)
- [ ] T017 [US1] Load report list from `GET /api/audit-log/reports` into Report List dropdown in `frontend/src/components/ViewLogReport/FilterForm` — populate dropdown with 12 items on component mount; set default selection to item id=1 (FR-005)

**Checkpoint**: LOG REPORT tab visible to authorized users; filter form renders with correct defaults; unauthorized users are hidden from tab and redirected on direct URL access

---

## Phase 4: User Story 2 & 2b - Filter, Search & Dynamic Report Tabs (Priority: P2)

**Goal**: ผู้ดูแลระบบเลือกเงื่อนไขใน filter form กด Submit เปิด dynamic report tab แสดงผลลัพธ์พร้อมตารางข้อมูลและ pagination

**Independent Test**: เลือก "11. Failed Login" → กำหนด From=2026-04-01, To=2026-05-31 (61 วัน ≤ 90) → กด Submit → tab "11. Failed Login" เปิด → header แสดง "Report: 11. Failed Login | Date: 2026-04-01 to 2026-05-31" → ตารางมี 10 คอลัมน์ครบ → กด Reset → form กลับ default, tab ยังคงแสดงผลเดิม

### Implementation for User Story 2 & 2b

- [ ] T018 [US2] Implement `AuditLogService.queryReport11` in `backend/src/services/AuditLog/AuditLogService` — query failed login log table with `FilterCriteria`, join `action_catalog` via `ActionCatalogRepository.lookupActionDesc`, return rows with all 10 Report 11 columns (data-model.md §1), enforce 90-day validation (returns error if violated)
- [ ] T019 [P] [US2] Implement `AuditLogService.queryReport12` in `backend/src/services/AuditLog/AuditLogService` — query audit log table with `FilterCriteria`, return rows with all 9 Report 12 columns (data-model.md §2), enforce 90-day validation; `UPDATED_DATA` and `PREVIOUS_DATA` may be null/empty (FR-017f)
- [ ] T020 [US2] Implement `POST /api/audit-log/reports/{reportId}/query` endpoint in `backend/src/api/AuditLog/AuditLogController` — validates `FilterCriteria` (from ≤ to → `INVALID_DATE_RANGE`; 90-day for R11/12 → `DATE_RANGE_EXCEEDED`); routes to `queryReport11` or `queryReport12`; returns paginated response per contracts/api-contracts.md §3
- [ ] T021 [P] [US2] Implement `auditLogApi` service in `frontend/src/services/auditLogApi/` — methods: `queryReport(reportId, filterCriteria, page, pageSize)` calling `POST /api/audit-log/reports/{reportId}/query`; handle 400 error codes (`DATE_RANGE_EXCEEDED`, `INVALID_DATE_RANGE`) and return structured error objects
- [ ] T022 [US2] Implement Submit handler in `frontend/src/components/ViewLogReport/FilterForm` — client-side validation: date format (YYYY-MM-DD), from ≤ to (FR-011), 90-day check for Report 11/12 (FR-012); disable Submit button on click; re-enable on API response (success or error); show validation error message without opening tab if validation fails (FR-008, clarification Q3)
- [ ] T023 [US2b] Implement dynamic report tab management in `frontend/src/components/AuditLogPage/` — on Submit success: open new tab named after report (e.g., "11. Failed Login"); if tab already open for same report: update content in existing tab instead of opening duplicate (FR-008, FR-009)
- [ ] T024 [US2b] Build `ReportTab` container component in `frontend/src/components/ReportTab/` — renders report header: "Report: {reportName}" and "Date: {fromPeriod} to {toPeriod}"; renders appropriate data table based on reportId; renders export icon (FR-013, FR-014)
- [ ] T025 [US2b] Build Report 11 (Failed Login) DataTable in `frontend/src/components/ReportTab/Report11Table` — renders exactly 10 columns in order: Login Datetime, ACTION, ACTION_DESC, User Name, Group, Administrator, Firstname, Lastname, Client IP Address, Client Name; Administrator cell renders "Y" or "" (never null string or "-") (FR-017, FR-017a, FR-017c)
- [ ] T026 [P] [US2b] Build Report 12 (Audit Log) DataTable in `frontend/src/components/ReportTab/Report12Table` — renders exactly 9 columns in order: username, ACTION, ACTION_DATE, ACTION_DESC, RESULT, IP_ADDRESS, UPDATED_DATA, PREVIOUS_DATA, MODIFY_BY; UPDATED_DATA and PREVIOUS_DATA show empty cell when null (FR-017d, FR-017e, FR-017f)
- [ ] T027 [US2b] Implement cursor-based pagination in `frontend/src/components/DataTable/` — page size 50 rows default; show total count (FR-015, FR-016); previous/next navigation; auto-loads next page via `auditLogApi` service
- [ ] T028 [US2] Implement Reset button logic in `frontend/src/components/ViewLogReport/FilterForm` — on click: reset Report List to item 1, clear From/To Period, set User Status to "All"; do NOT close or refresh any open report tabs (FR-010)

**Checkpoint**: Submit opens/updates report tabs; Report 11 and 12 show correct columns; 90-day validation blocks invalid searches; Reset clears form without affecting open tabs

---

## Phase 5: User Story 3 - Log Entry Detail View (Priority: P3)

**Goal**: ผู้ดูแลระบบคลิกดูรายละเอียดของ log entry รายการหนึ่งเพื่อเห็นข้อมูลทั้งหมดรวม before/after data

**Independent Test**: ใน tab "12. Audit Log" คลิก log entry ใดรายการหนึ่ง → modal/panel เปิดแสดงทุกฟิลด์รวม UPDATED_DATA และ PREVIOUS_DATA → ปิด modal → กลับสู่ report tab พร้อมเงื่อนไขกรองเดิม

### Implementation for User Story 3

- [ ] T029 [US3] Build `LogEntryDetailModal` component in `frontend/src/components/ReportTab/LogEntryDetail` — triggered by clicking any row in a report tab; displays all fields of the selected row in a readable layout; shows UPDATED_DATA and PREVIOUS_DATA with full text (not truncated) for Report 12; shows empty/blank when those fields are null (spec §US3 scenario 1)
- [ ] T030 [US3] Implement close/back behavior in `frontend/src/components/ReportTab/LogEntryDetail` — closing modal returns focus to report tab with filter criteria and pagination position preserved (spec §US3 scenario 2)

**Checkpoint**: Clicking any log entry shows full details; closing returns to report tab with state intact

---

## Phase 6: User Story 4 - Export CSV & Export All ZIP (Priority: P4)

**Goal**: ผู้ดูแลระบบ export แต่ละ report เป็น CSV และ export ทุก report พร้อมกันเป็น ZIP ผ่าน Export All tab

**Independent Test**: เปิด Export All tab → กำหนด From=2025-01-01, To=2026-05-31, User Status=All → กด Download → รับ ZIP file → ZIP มีไฟล์ CSV ครบ 12 ไฟล์ → Report 11/12 CSV มีข้อมูลเฉพาะ 90 วันล่าสุด (clamped) → Report 1–10 มีข้อมูลครบตามช่วงที่กำหนด

### Implementation for User Story 4

- [ ] T031 [US4] Implement `ExportService.exportReportAsCsv` in `backend/src/services/AuditLog/ExportService` — streams query results to CSV with UTF-8 BOM header; uses same `FilterCriteria` and column ordering as query; filename format: `{reportId}_{ReportName}_{fromPeriod}_{toPeriod}.csv`; empty cells as `""` not `null` (FR-018, FR-019, contracts/api-contracts.md §4)
- [ ] T032 [P] [US4] Implement `POST /api/audit-log/reports/{reportId}/export` endpoint in `backend/src/api/AuditLog/AuditLogController` — applies same validation as query endpoint; streams CSV response; returns 400 on validation errors (contracts/api-contracts.md §4)
- [ ] T033 [US4] Implement `ExportService.exportAllAsZip` in `backend/src/services/AuditLog/ExportService` — iterates Reports 1–12; for Reports 11/12: clamp `fromPeriod` to `max(fromPeriod, currentDate − 90)` silently (do NOT fail); streams each CSV into a single ZIP archive; applies `userStatus` and date filter uniformly across all reports (FR-022, FR-023b, FR-023c, research.md §3)
- [ ] T034 [P] [US4] Implement `POST /api/audit-log/export-all` endpoint in `backend/src/api/AuditLog/AuditLogController` — validates from ≤ to only (no 90-day block); calls `ExportService.exportAllAsZip`; streams ZIP response with filename `AuditLog_Export_{fromPeriod}_{toPeriod}.zip`; on error/timeout returns `{ error: "EXPORT_FAILED" }` (FR-022, FR-023, contracts/api-contracts.md §5)
- [ ] T035 [US4] Add export icon to each report tab in `frontend/src/components/ReportTab/` — icon triggers `POST /api/audit-log/reports/{reportId}/export` with current tab's filter criteria; show status indicator: "กำลัง export...", "สำเร็จ", "ล้มเหลว" (FR-018, FR-020)
- [ ] T036 [P] [US4] Implement `exportService` in `frontend/src/services/exportService/` — method: `downloadCsv(reportId, filterCriteria)`: calls export endpoint, triggers browser file download, handles errors (show error message); method: `downloadZip(filterCriteria)`: calls export-all endpoint, triggers browser ZIP download, handles errors + retry
- [ ] T037 [US4] Build Export All sub-tab filter form in `frontend/src/components/ExportAllForm/` — fields: From Period (text + calendar icon), To Period (text + calendar icon), User Status (radio: All/Enable/Disable), Download button, Reset button; defaults: From/To = empty, User Status = "All" (FR-021, FR-023a)
- [ ] T038 [US4] Implement Download and Reset logic in `frontend/src/components/ExportAllForm/` — Download: validate from ≤ to (client-side), disable Download button during export, show "กำลัง export...", on error show error message with retry button; Reset: clear From/To Period, set User Status = "All" (FR-022, FR-023, FR-023a, clarification Q4)

**Checkpoint**: Each report tab has working CSV export; Export All produces ZIP with 12 CSVs; Reports 11/12 silently clamped in ZIP; Download button disables during export; errors show retry option

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, error handling, and UX polish across all stories

- [ ] T039 [P] Implement 90-day violation error message in `frontend/src/components/ViewLogReport/FilterForm` — when Submit validation fails for Reports 11/12: show localized error "ข้อมูลย้อนหลังได้สูงสุด 90 วัน" inline below the date fields; do NOT open a report tab (FR-012, spec §US2b scenario 4)
- [ ] T040 [P] Implement session expiry handling in `frontend/src/services/auditLogApi/` — intercept 401/403 responses from any audit log API call during an active session; redirect to login page with return URL (spec edge case: session หมดอายุระหว่างดูข้อมูล)
- [ ] T041 [P] Add loading state indicators in `frontend/src/components/ReportTab/` and `frontend/src/components/DataTable/` — show spinner/skeleton during initial query load and pagination navigation; suppress Submit button re-enable until spinner clears
- [ ] T042 [P] Validate Administrator column rendering in `frontend/src/components/ReportTab/Report11Table` — add prop-level assertion: `isAdministrator` must render as `"Y"` or `""` only; never render null, undefined, or `"-"` as a string (FR-017c, data-model.md §1)
- [ ] T043 [P] Add fallback safeguard for ACTION_DESC in `frontend/src/components/ReportTab/Report11Table` — if `actionDesc` is null/empty despite backend COALESCE (defensive check): display `"[${catalogId}]"` as last-resort fallback; log warning to console (FR-017b, clarification Q2)
- [ ] T044 Run quickstart.md validation checklist against implemented feature — verify each item in the "Running Tests" section passes; document any deviations in `specs/001-backoffice-audit-log/research.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately; T003 and T004 are [P] after T001/T002 start
- **Foundational (Phase 2)**: Requires T001–T004 complete — BLOCKS all user stories
- **US1 (Phase 3)**: Requires Phase 2 complete; T010–T012 and T016 are [P]; T017 requires T010 + T016
- **US2/US2b (Phase 4)**: Requires Phase 3 complete; T018/T019 are [P]; T025/T026 are [P]; T021 is [P] with backend T020
- **US3 (Phase 5)**: Requires T024/T025 complete (report tabs must exist)
- **US4 (Phase 6)**: Requires Phase 4 complete; T032 and T034 are [P] with their respective service tasks; T036 is [P] with T032
- **Polish (Phase 7)**: Requires all desired story phases complete; all T039–T043 are [P] with each other

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no other story dependencies
- **US2/US2b (P2)**: Can start after Phase 3 (US1) complete — tabs open from filter form
- **US3 (P3)**: Can start after US2b report tab is renderable (T024 complete)
- **US4 (P4)**: Can start after US2/US2b complete (ExportService reuses query logic; Export All sub-tab is separate UI)

### Within Each Story

- Backend models/DTOs before repositories before services before controllers
- Frontend API service before UI handlers that call it
- Container components before child components
- Core feature before validation edge cases

---

## Parallel Opportunities

### Phase 2 Parallel Block
```
T005 ActionCatalogRepository
T006 FilterCriteria DTO          ← parallel
T007 UserPermissionRepository    ← parallel
```
Then T008 (depends on T005 + T006).

### Phase 3 Parallel Block
```
T009 GET /access
T010 GET /reports                ← parallel
T011 GET /permissions            ← parallel
T012 PUT /permissions            ← parallel
T016 Filter form UI              ← parallel with backend tasks
```

### Phase 4 Parallel Block
```
T018 queryReport11
T019 queryReport12               ← parallel with T018
```
Then T020 (depends on T018 + T019).
```
T021 auditLogApi service         ← parallel with T020 (different layer)
T025 Report11Table
T026 Report12Table               ← parallel with T025
```

### Phase 6 Parallel Block
```
T031 ExportService CSV
T032 POST /export endpoint       ← start after T031
T033 ExportService ZIP           ← start after T031 (reuses CSV method)
T034 POST /export-all endpoint   ← start after T033
T036 exportService frontend      ← parallel with T032 (different layer)
```

---

## Implementation Strategy

### MVP First (US1 Only — Phase 1+2+3)

1. Complete Phase 1: Setup (T001–T004)
2. Complete Phase 2: Foundational (T005–T008)
3. Complete Phase 3: US1 (T009–T017)
4. **STOP and VALIDATE**: LOG REPORT tab shows, filter form has correct defaults, unauthorized users are blocked
5. Demo navigation + access control to stakeholders

### Incremental Delivery

1. Phase 1+2+3 → US1 MVP: Navigation + form display ✓
2. Add Phase 4 → US2/US2b: Filtering + report tabs working ✓
3. Add Phase 5 → US3: Detail view ✓
4. Add Phase 6 → US4: Export CSV + ZIP ✓
5. Add Phase 7 → Polish: Edge cases + error handling ✓

### Parallel Team Strategy

After Phase 1+2 complete:
- Developer A: US1 (Phase 3) — access control + navigation
- Developer B: US2/US2b backend (T018–T020) — query APIs
- Developer C: US2/US2b frontend (T021–T028) — after backend contracts confirmed

---

## Notes

- [P] tasks operate on different files with no blocking dependencies — safe to parallelize
- [Story] label maps each task to its user story for independent testing
- Reports 1–10 implementation is Phase E (separate feature iteration) — column specs must be added to spec.md first per FR-017-note
- Administrator column: render `"Y"` or `""` — never `null`, `"null"`, or `"-"` (FR-017c)
- ACTION_DESC: server enforces COALESCE; frontend adds defensive fallback (T043)
- Date range: UI uses YYYY-MM-DD; backend expands to full day timestamps for DB queries
- Confirm actual table names before T005/T007/T008 implementation (T001 output)
