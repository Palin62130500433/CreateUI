const BASE = '/api/audit-log';

async function triggerDownload(res, defaultFilename) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Export failed.' }));
    throw err;
  }
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : defaultFilename;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadReportCsv(reportId, filterCriteria) {
  const res = await fetch(`${BASE}/reports/${reportId}/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filterCriteria),
  });
  await triggerDownload(res, `report_${reportId}.csv`);
}

export async function downloadAllZip(filterCriteria) {
  const res = await fetch(`${BASE}/export-all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filterCriteria),
  });
  await triggerDownload(res, 'AuditLog_Export.zip');
}
