# Developer Quickstart: Backoffice Audit Log Viewer

**Branch**: `001-backoffice-audit-log` | **Date**: 2026-06-02

---

## Overview

This feature adds a **LOG REPORT tab** to the existing Backoffice system. It is read-only: no new data is written — the feature only queries existing audit log tables and serves the data as paginated views and CSV/ZIP exports.

---

## Prerequisites

Before implementing, confirm the following with the platform team:

| Item | Question | Why Needed |
|------|----------|------------|
| Backend framework | Java/Spring? .NET? PHP? | Determines controller/service patterns |
| Database vendor | Oracle? MSSQL? PostgreSQL? | Affects SQL syntax, date functions, CAST |
| Frontend framework | Angular? React? Vue? jQuery? | Determines component structure |
| Existing auth mechanism | Session? JWT? | API endpoints must reuse existing auth |
| Existing table names | `audit_log`? `sys_log`? | data-model.md uses logical names — map to real tables |
| API base path convention | `/api/`? `/rest/`? | Adjust base path in contracts/api-contracts.md |

---

## Key Tables (Logical Names)

| Logical Name | Description | Used By |
|---|---|---|
| `failed_login_log` | Login failure events (Report 11) | `/reports/11/query` |
| `audit_log` | Data change events (Report 12) | `/reports/12/query` |
| `action_catalog` | CATALOG_ID → NAME_EN lookup | Both Report 11 queries |
| `users` | User accounts with status + permission flag | All filtered queries; permission endpoints |

Map these to actual table names in the existing database before implementation.

---

## Feature Scope (This Branch)

### In scope
- LOG REPORT tab in Backoffice navigation (FR-001 to FR-003)
- View Log Report sub-tab with filter form (FR-004 to FR-012)
- Dynamic report tabs for Reports 11 and 12 (FR-013 to FR-017f)
- Per-report CSV export icon (FR-018 to FR-020)
- Export All sub-tab with ZIP download (FR-021 to FR-023c)
- Username-level permission control (FR-024 to FR-026)

### Separate phase (not this iteration)
- Report tabs 1–10 column specifications and implementation (FR-017-note)

---

## Implementation Phases

### Phase A: Foundation & Access Control
1. Add `has_audit_log_access` column to users table (if not existing)
2. Implement permission endpoints (GET/PUT `/api/audit-log/permissions/{username}`)
3. Implement access check endpoint (`GET /api/audit-log/access`)
4. Add LOG REPORT tab to navigation; hide/show based on permission
5. Redirect on direct URL access without permission (FR-026)

### Phase B: View Log Report — Filter Form
1. Build filter form UI: Report List dropdown, From/To Period (date picker + text input), User Status radio, Submit/Reset icons
2. Implement date format validation (`YYYY-MM-DD`; from ≤ to; FR-011)
3. Implement 90-day constraint check for Reports 11–12 on Submit (client + server)
4. Implement Submit disable-while-loading behavior (FR-008, clarification Q3)
5. Implement Reset behavior: clear form to defaults, keep open tabs (FR-010)

### Phase C: Report Tabs 11 & 12
1. Implement `POST /api/audit-log/reports/{reportId}/query` for reports 11 and 12
2. Build dynamic report tab component (opens/updates on Submit)
3. Display report header (Report name + Date range)
4. Render paginated data table with correct columns per report
5. Implement catalog lookup with COALESCE fallback (research.md §6)

### Phase D: Export
1. Implement `POST /api/audit-log/reports/{reportId}/export` (CSV streaming)
2. Add export icon to each report tab; show status (FR-020)
3. Implement Export All sub-tab filter form
4. Implement `POST /api/audit-log/export-all` (ZIP with 12 CSVs)
5. Handle export errors with error message + retry (FR-023, clarification Q4)

### Phase E: Reports 1–10 (Separate Phase)
- Awaiting column specifications in spec.md

---

## Key Business Rules (Quick Reference)

| Rule | Detail | Reference |
|------|--------|-----------|
| Date format | UI: `YYYY-MM-DD` / DB: `YYYY-MM-DD HH:MM:SS.ms` | FR-006, clarification Q1 |
| 90-day View: block | Reports 11–12: error if range > 90 days, no tab opened | FR-012 |
| 90-day Export: clamp | Reports 11–12: silently export only available 90 days | FR-023c |
| ACTION fixed value | Report 11: ACTION column always = `"LOGIN"` | FR-017a |
| ACTION_DESC never null | Fallback to raw CATALOG_ID if lookup fails | FR-017b, clarification Q2 |
| Administrator display | `"Y"` or `""` (empty) — never `"-"` or `"null"` | FR-017c |
| Submit disable | Disable Submit button during loading; re-enable on completion | FR-008, clarification Q3 |
| Reset behavior | Clear form to defaults; keep open report tabs unchanged | FR-010 |
| Permission model | Username-level flag (not role-based) | FR-024 |

---

## Running Tests

Tests must cover:

- [ ] 90-day validation (boundary: exactly 90 days = pass; 91 days = fail for View; clamp for Export All)
- [ ] CATALOG_ID miss → ACTION_DESC = raw CATALOG_ID string (not null, not empty)
- [ ] Administrator column = `"Y"` or `""` only (not null, not `"-"`)
- [ ] Submit button disabled during loading (UI state test)
- [ ] Reset clears form but does not close/reload report tabs
- [ ] Permission: hidden tab + redirect on direct URL access
- [ ] Export ZIP: contains exactly 12 CSV files; Reports 11–12 use clamped date range
- [ ] Date range validation: from > to → error (FR-011)
