# API Contracts: Backoffice Audit Log Viewer

**Branch**: `001-backoffice-audit-log` | **Date**: 2026-06-02  
**Style**: REST / JSON  
**Base path**: `/api/audit-log` (adjust to match existing Backoffice API conventions)  
**Auth**: Session-based (existing Backoffice auth — all endpoints require authenticated session)

---

## Endpoints

### 1. Check Audit Log Access

Verify the current user has permission to access LOG REPORT tab.

```
GET /api/audit-log/access
```

**Response 200**:
```json
{
  "hasAccess": true
}
```

**Response 403** (not authenticated):
```json
{ "error": "Unauthorized" }
```

**Used by**: Navigation guard to show/hide LOG REPORT tab (FR-024, FR-026).

---

### 2. Get Report List

Return the 12 available reports with their metadata.

```
GET /api/audit-log/reports
```

**Response 200**:
```json
{
  "reports": [
    { "id": 1,  "name": "Usage Time Per User",      "maxDays": null },
    { "id": 2,  "name": "Total Usage User Per Day",  "maxDays": null },
    { "id": 3,  "name": "Usage By Module",            "maxDays": null },
    { "id": 4,  "name": "Usage Report By Hour",       "maxDays": null },
    { "id": 5,  "name": "User Not Login",             "maxDays": null },
    { "id": 6,  "name": "Update Data",                "maxDays": null },
    { "id": 7,  "name": "Last Login 3 Months",        "maxDays": null },
    { "id": 8,  "name": "Current User in System",     "maxDays": null },
    { "id": 9,  "name": "Last Login",                 "maxDays": null },
    { "id": 10, "name": "Successfully Login",         "maxDays": null },
    { "id": 11, "name": "Failed Login",               "maxDays": 90  },
    { "id": 12, "name": "Audit Log",                  "maxDays": 90  }
  ]
}
```

**Notes**: `maxDays: null` = no date restriction; `maxDays: 90` = 90-day lookback limit (FR-012).

---

### 3. Query Report Data (View Log Report)

Execute a report query with filters and return paginated results.

```
POST /api/audit-log/reports/{reportId}/query
```

**Path param**: `reportId` — integer 1–12

**Request body**:
```json
{
  "fromPeriod": "2026-03-01",
  "toPeriod":   "2026-05-31",
  "userStatus": "All",
  "page":       1,
  "pageSize":   50
}
```

**Field rules**:
- `fromPeriod`, `toPeriod`: `YYYY-MM-DD` format (FR-006)
- `userStatus`: `"All"` | `"Enable"` | `"Disable"` (default `"All"`)
- `fromPeriod` must be ≤ `toPeriod` (FR-011)
- For `reportId` 11 or 12: `(toPeriod − fromPeriod)` must be ≤ 90 days (FR-012)

**Response 200**:
```json
{
  "reportId":   11,
  "reportName": "Failed Login",
  "fromPeriod": "2026-03-01",
  "toPeriod":   "2026-05-31",
  "totalCount": 1247,
  "page":       1,
  "pageSize":   50,
  "data": [
    {
      "loginDatetime":    "2026-05-15 09:23:11.00",
      "action":           "LOGIN",
      "actionDesc":       "Invalid Username or Password",
      "userName":         "jsmith",
      "groupName":        "IT Support",
      "isAdministrator":  "Y",
      "firstname":        "John",
      "lastname":         "Smith",
      "clientIpAddress":  "192.168.1.101",
      "clientName":       "PC-JSMITH"
    }
  ]
}
```

**Response 400** (validation error):
```json
{
  "error":   "DATE_RANGE_EXCEEDED",
  "message": "Report 11 allows a maximum of 90 days lookback. Requested range: 182 days."
}
```

**Response 400** (from > to):
```json
{
  "error":   "INVALID_DATE_RANGE",
  "message": "fromPeriod must not be after toPeriod."
}
```

**Response 403**: User lacks audit log access.

---

### 4. Export Report as CSV

Export a single report's data as a downloadable CSV file.

```
POST /api/audit-log/reports/{reportId}/export
Content-Type: application/json
```

**Request body** (same as query, no pagination):
```json
{
  "fromPeriod": "2026-03-01",
  "toPeriod":   "2026-05-31",
  "userStatus": "All"
}
```

**Response 200**:
```
Content-Type: text/csv; charset=UTF-8
Content-Disposition: attachment; filename="11_Failed_Login_2026-03-01_2026-05-31.csv"

Login Datetime,ACTION,ACTION_DESC,User Name,Group,Administrator,...
2026-05-15 09:23:11.00,LOGIN,Invalid Username or Password,jsmith,...
```

**Response 400**: Same validation errors as query endpoint.  
**Response 403**: Unauthorized.

**Notes**: CSV filename format: `{reportId}_{ReportName}_{fromPeriod}_{toPeriod}.csv` (FR-018, FR-019).

---

### 5. Export All Reports as ZIP

Export all 12 reports as a single ZIP file containing one CSV per report.

```
POST /api/audit-log/export-all
Content-Type: application/json
```

**Request body**:
```json
{
  "fromPeriod": "2025-01-01",
  "toPeriod":   "2026-05-31",
  "userStatus": "Enable"
}
```

**Behavior**:
- Reports 1–10: export full range as specified
- Reports 11–12: silently clamp to `max(fromPeriod, current_date − 90)` — do NOT block (FR-023c)
- All 12 filters (`userStatus`, date range) applied uniformly (FR-023b)

**Response 200**:
```
Content-Type: application/zip
Content-Disposition: attachment; filename="AuditLog_Export_2025-01-01_2026-05-31.zip"

[binary ZIP stream]
```

ZIP contents:
```
AuditLog_Export_2025-01-01_2026-05-31.zip
├── 01_Usage_Time_Per_User_2025-01-01_2026-05-31.csv
├── 02_Total_Usage_User_Per_Day_2025-01-01_2026-05-31.csv
├── ...
├── 11_Failed_Login_2026-03-04_2026-05-31.csv    ← clamped from period
└── 12_Audit_Log_2026-03-04_2026-05-31.csv       ← clamped from period
```

**Response 400** (`fromPeriod` > `toPeriod`):
```json
{ "error": "INVALID_DATE_RANGE", "message": "fromPeriod must not be after toPeriod." }
```

**Response 500 / timeout** (fail-fast per clarification Q4):
```json
{ "error": "EXPORT_FAILED", "message": "Export failed. Please try again." }
```

**Response 403**: Unauthorized.

---

### 6. Get User Audit Log Permission (Admin)

Check if a specific user has audit log access (for admin permission management).

```
GET /api/audit-log/permissions/{username}
```

**Response 200**:
```json
{
  "username":         "jsmith",
  "hasAuditLogAccess": true
}
```

---

### 7. Update User Audit Log Permission (Admin)

Grant or revoke audit log access for a user (FR-025).

```
PUT /api/audit-log/permissions/{username}
```

**Request body**:
```json
{
  "hasAuditLogAccess": false
}
```

**Response 200**:
```json
{
  "username":         "jsmith",
  "hasAuditLogAccess": false,
  "updatedAt":        "2026-06-02T10:00:00"
}
```

---

## Error Code Reference

| Code | HTTP | Meaning |
|------|------|---------|
| `DATE_RANGE_EXCEEDED` | 400 | Report 11/12 queried with > 90 day range in View Log Report |
| `INVALID_DATE_RANGE` | 400 | `fromPeriod` > `toPeriod` |
| `INVALID_REPORT_ID` | 400 | `reportId` not in 1–12 |
| `EXPORT_FAILED` | 500 | Server-side export error or timeout |
| `Unauthorized` | 403 | No valid session or no audit log permission |

---

## Common Conventions

- **Date format**: `YYYY-MM-DD` in all request/response bodies (ISO 8601)
- **Timestamp format**: `YYYY-MM-DD HH:MM:SS.ms` in data rows
- **Pagination**: cursor-based; `page` + `pageSize` in request; `totalCount` in response
- **CSV encoding**: UTF-8 with BOM (`﻿`) for Excel compatibility
- **Empty cells**: represented as empty string `""` (not `null`) in CSV output
- **Administrator column (Report 11)**: `"Y"` or `""` — never `"null"` string (FR-017c)
