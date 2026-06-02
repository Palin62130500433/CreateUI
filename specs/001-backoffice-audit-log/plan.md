# Implementation Plan: Backoffice Audit Log Viewer

**Branch**: `001-backoffice-audit-log` | **Date**: 2026-06-02 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `specs/001-backoffice-audit-log/spec.md`

---

## Summary

Add a read-only **LOG REPORT tab** to the existing Backoffice system that allows authorized administrators to view, filter, and export audit log data across 12 report types. The feature uses username-level permission control, enforces a 90-day data availability constraint on Reports 11–12, and supports per-report CSV export and bulk ZIP export of all 12 reports. Reports 1–10 column specifications are included in this plan but their implementation is a separate phase.

**Technical approach**: REST API additions to existing Backoffice backend + UI components in existing frontend framework. All data is read-only from existing audit log database tables. No new tables required except a possible `has_audit_log_access` permission flag on the users table.

---

## Technical Context

**Language/Version**: NEEDS CLARIFICATION — constrained by existing Backoffice stack (likely Java/Spring, .NET/ASP.NET, or PHP)  
**Primary Dependencies**: NEEDS CLARIFICATION — reuse existing Backoffice framework and ORM/data access layer  
**Storage**: NEEDS CLARIFICATION — existing database (column naming conventions suggest Oracle or MSSQL); tables: `failed_login_log`, `audit_log`, `action_catalog`, `users`  
**Testing**: NEEDS CLARIFICATION — follow existing Backoffice test patterns and frameworks  
**Target Platform**: Desktop browser (primary); mobile browser (nice-to-have)  
**Project Type**: Web application module — addition to existing Backoffice system  
**Performance Goals**: Page load < 3 seconds with 100K+ records (SC-001); filter results 100% accurate (SC-003)  
**Constraints**: 90-day data limit for Reports 11–12; read-only (no writes to audit log); username-level permission control; synchronous export with fail-fast error handling  
**Scale/Scope**: 12 report types; 100K+ records; cursor-based pagination (50 rows/page default)

> **Action required**: Confirm tech stack, database vendor, and existing table names with platform team before Phase A implementation. See `quickstart.md` prerequisites table.

---

## Constitution Check

*The project constitution (`.specify/memory/constitution.md`) is using the default template with no project-specific principles filled in. No gates to enforce.*

**Post-design re-check**: N/A — no constitution violations found. Design follows standard web application extension patterns: REST API additions, UI component additions, reuse of existing auth/session infrastructure.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-backoffice-audit-log/
├── plan.md              ← This file
├── research.md          ← Phase 0: research findings and decisions
├── data-model.md        ← Phase 1: entity definitions and field specs
├── quickstart.md        ← Phase 1: developer setup and implementation guide
├── contracts/
│   └── api-contracts.md ← Phase 1: REST API endpoint contracts
├── checklists/
│   └── requirements.md  ← Spec quality checklist
├── spec.md              ← Feature specification
└── tasks.md             ← Phase 2 output (/speckit-tasks — not yet created)
```

### Source Code (repository root)

This feature extends an **existing Backoffice web application**. Exact paths depend on the existing project structure. The logical layout follows Option 2 (Web application — frontend + backend):

```text
backend/
├── src/
│   ├── models/
│   │   └── AuditLog/        # AuditLogEntry (R11, R12), ActionCatalog, User entities
│   ├── repositories/
│   │   └── AuditLog/        # AuditLogRepository, UserPermissionRepository
│   ├── services/
│   │   └── AuditLog/        # AuditLogService (query, 90-day logic), ExportService (CSV/ZIP)
│   └── api/
│       └── AuditLog/        # AuditLogController (REST endpoints per api-contracts.md)
└── tests/
    ├── unit/
    │   └── AuditLog/        # Service logic, 90-day validation, CATALOG_ID fallback
    └── integration/
        └── AuditLog/        # API endpoint tests with real DB queries

frontend/
├── src/
│   ├── components/
│   │   ├── AuditLogPage/    # Top-level page container with tab bar
│   │   ├── ViewLogReport/   # Filter form sub-tab (Report List, dates, status, Submit/Reset)
│   │   ├── ExportAllForm/   # Export All sub-tab filter form + Download button
│   │   ├── ReportTab/       # Dynamic tab component for report results
│   │   └── DataTable/       # Paginated table with column definitions per report
│   ├── pages/
│   │   └── AuditLog/        # Route/page entry point
│   └── services/
│       ├── auditLogApi/     # API client (fetch/axios wrapper for audit log endpoints)
│       └── exportService/   # CSV/ZIP download trigger and error handling
└── tests/
    ├── unit/
    │   └── AuditLog/        # Filter form validation, 90-day UI logic, button states
    └── e2e/
        └── AuditLog/        # Full user journey tests (navigation, filter, export)
```

**Structure decision**: Web application (frontend + backend) because the Backoffice is a browser-based system with a distinct UI layer and server-side data access. The feature adds components to both layers.

---

## Implementation Phases

### Phase A — Foundation & Access Control
**Covers**: FR-001, FR-002, FR-003, FR-024, FR-025, FR-026  
**Deliverables**: LOG REPORT tab in navigation; permission flag on users; access check + permission management API endpoints; redirect for unauthorized direct URL access.

### Phase B — View Log Report Filter Form
**Covers**: FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, FR-011, FR-012  
**Deliverables**: Filter form UI (dropdown, date pickers, radio, Submit/Reset); date validation; 90-day constraint check; Submit disable-while-loading; Reset behavior.

### Phase C — Report Tabs 11 & 12
**Covers**: FR-013, FR-014, FR-015, FR-016, FR-017, FR-017a–f  
**Deliverables**: Query API for Reports 11 and 12; dynamic report tab (open/update); report header; paginated data table with correct columns; catalog lookup with COALESCE fallback.

### Phase D — Export
**Covers**: FR-018, FR-019, FR-020, FR-021, FR-022, FR-023, FR-023a–c  
**Deliverables**: Per-report CSV export icon + download; Export All sub-tab filter form; bulk ZIP export API; error handling with retry.

### Phase E — Reports 1–10 (Separate Phase)
**Covers**: FR-017-note  
**Deliverables**: Column specifications in spec.md (first); then query API and report tab UI for each of the 10 reports.  
**Status**: Column specs pending — implementation blocked until spec is updated.

---

## Complexity Tracking

No constitution violations. No complexity justification required.
