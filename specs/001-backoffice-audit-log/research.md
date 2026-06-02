# Research: Backoffice Audit Log Viewer

**Branch**: `001-backoffice-audit-log` | **Date**: 2026-06-02  
**Phase**: 0 — Unknowns resolved before design

---

## 1. Tech Stack (NEEDS CLARIFICATION → Deferred)

**Decision**: Tech stack is constrained by the existing Backoffice system. All contracts are designed technology-agnostic (REST/JSON) so they work with Java/Spring, .NET/ASP.NET, PHP, or any existing backend.

**Rationale**: No source code exists in this repo — the Backoffice is an external system. API contracts and data models are specified at the interface level; implementation follows the existing stack's conventions.

**Action required before implementation**: Confirm existing Backoffice framework and database vendor (Oracle / MSSQL / PostgreSQL) with the platform team.

**Indicators from spec**: All-caps column names (`ACTION_DESC`, `CATALOG_ID`, `UPDATED_DATA`) are consistent with Oracle DB naming conventions. Thai enterprise Backoffice systems commonly run on Java/Spring + Oracle or .NET + MSSQL.

---

## 2. Pagination Strategy

**Decision**: Server-side **cursor-based pagination**, page size 50 rows default.

**Rationale**: Offset-based pagination degrades at scale (DB must skip rows); cursor-based maintains O(1) performance regardless of dataset size. For audit logs, users rarely jump to arbitrary pages — sequential navigation is the dominant pattern. Page size 50 balances network payload vs. readability for tabular audit data.

**Alternatives considered**:
- Offset pagination — rejected: slow beyond page 1000 with 100K records
- Client-side pagination — rejected: requires loading all records upfront, violates SC-001 (3s load time)

**Implementation note**: Sort on indexed timestamp column; encode cursor as the last-seen timestamp + ID pair (opaque to client).

---

## 3. ZIP Export Strategy (Export All)

**Decision**: Synchronous server-side ZIP generation with fail-fast error handling.

**Rationale**: Per clarification Q4 (2026-05-29), Export All uses fail-fast: if the request fails or times out, show an error message and let the user retry. This avoids background job infrastructure complexity. Stream each CSV into the ZIP sequentially to avoid memory spikes.

**Timeout**: Server should set a generous timeout (5 minutes) before failing. Client should display a spinner with "กำลัง export..." message and a timeout fallback.

**Alternatives considered**:
- Async background job — rejected: out-of-scope for this iteration (clarification Q4)
- Streaming ZIP to browser — preferred for large exports but requires streaming-capable server support; defer to implementation team based on existing stack

---

## 4. 90-Day Constraint Enforcement

**Decision**: Dual-layer validation — client-side UX feedback + mandatory server-side enforcement.

**Applies to**:
- **View Log Report (Submit)**: Block if date range > 90 days for Reports 11–12. Show error; do not open tab.
- **Export All (Download)**: Do NOT block — silently clamp Report 11–12 data to current_date − 90. Reports 1–10 unaffected.

**Rationale**: Client-side prevents unnecessary round-trips; server-side prevents bypass via direct API calls. The two behaviors (block vs. clamp) are intentionally different per clarification Q5 (2026-05-26 session).

**Date boundary calculation**: 90 days = `current_date - 90` (inclusive). Example: today = 2026-06-02 → earliest allowed date = 2026-03-04.

---

## 5. Date Format

**Decision**: UI input/display uses `YYYY-MM-DD` (ISO 8601). DB stores full timestamp `YYYY-MM-DD HH:MM:SS.ms`.

**Query range expansion**: When filtering by From Period / To Period, expand to full day:
- From: `YYYY-MM-DD 00:00:00.000`
- To: `YYYY-MM-DD 23:59:59.999`

**Source**: Clarification Q1 (2026-05-29).

---

## 6. CATALOG_ID Lookup (ACTION_DESC)

**Decision**: `LEFT JOIN` catalog table; `COALESCE(catalog.name_en, CAST(log.catalog_id AS VARCHAR))`.

**Rationale**: ACTION_DESC must never be null (clarification Q2, 2026-05-29). If CATALOG_ID has no matching row in catalog (9010001–9010010), display the raw CATALOG_ID string. Preserves data integrity without hiding unknown codes.

**SQL pattern**:
```sql
LEFT JOIN action_catalog ac ON log.catalog_id = ac.catalog_id
SELECT COALESCE(ac.name_en, CAST(log.catalog_id AS VARCHAR)) AS action_desc
```

---

## 7. Submit Button State

**Decision**: Disable Submit button on click; re-enable on request completion (success or error).

**Include 10-second timeout auto-unlock**: if the request hangs silently, re-enable the button with an error message.

**Source**: Clarification Q3 (2026-05-29).

**Also applies to**: Download button in Export All (same disable-while-loading pattern).

---

## 8. Reports 1–10 Scope

**Decision**: Column specifications for Reports 1–10 will be added to spec.md in this branch, but implementation is a separate phase.

**Source**: Clarification Q5 (2026-06-02).

**Impact on plan**: data-model.md documents entity shapes for Reports 11–12 fully. Reports 1–10 column specs are placeholders pending spec additions.
