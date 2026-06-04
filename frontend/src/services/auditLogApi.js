const BASE = '/api/audit-log';

async function handleResponse(res) {
  const data = await res.json().catch(() => ({ error: 'PARSE_ERROR' }));
  if (!res.ok) throw data;
  return data;
}

export async function checkAccess() {
  const res = await fetch(`${BASE}/access`);
  return handleResponse(res);
}

export async function getReports() {
  const res = await fetch(`${BASE}/reports`);
  return handleResponse(res);
}

export async function queryReport(reportId, filterCriteria, page = 1, pageSize = 50) {
  const res = await fetch(`${BASE}/reports/${reportId}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...filterCriteria, page, pageSize }),
  });
  return handleResponse(res);
}

export async function getPermission(username) {
  const res = await fetch(`${BASE}/permissions/${username}`);
  return handleResponse(res);
}

export async function updatePermission(username, hasAuditLogAccess) {
  const res = await fetch(`${BASE}/permissions/${username}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hasAuditLogAccess }),
  });
  return handleResponse(res);
}
