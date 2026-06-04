const archiver = require('archiver');
const { getReport11ForExport, getReport12ForExport } = require('./auditLogService');
const { REPORTS } = require('../data/mockData');

function escapeCsvCell(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowsToCsv(headers, rows) {
  const BOM = '﻿';
  const headerLine = headers.map(escapeCsvCell).join(',');
  const dataLines = rows.map((r) => headers.map((h) => escapeCsvCell(r[h] ?? '')).join(','));
  return BOM + [headerLine, ...dataLines].join('\r\n');
}

const REPORT11_HEADERS = [
  'loginDatetime', 'action', 'actionDesc', 'userName', 'groupName',
  'isAdministrator', 'firstname', 'lastname', 'clientIpAddress', 'clientName',
];
const REPORT11_DISPLAY = [
  'LOGIN DATETIME', 'ACTION', 'ACTION_DESC', 'USER NAME', 'GROUP',
  'ADMINISTRATOR', 'FIRSTNAME', 'LASTNAME', 'CLIENT IP ADDRESS', 'CLIENT NAME',
];

const REPORT12_HEADERS = [
  'username', 'action', 'actionDate', 'actionDesc', 'result',
  'ipAddress', 'updatedData', 'previousData', 'modifyBy',
];
const REPORT12_DISPLAY = [
  'USERNAME', 'ACTION', 'ACTION_DATE', 'ACTION_DESC', 'RESULT',
  'IP_ADDRESS', 'UPDATED_DATA', 'PREVIOUS_DATA', 'MODIFY_BY',
];

function buildCsvForReport(reportId, fromPeriod, toPeriod, userStatus, effectiveFrom) {
  const ef = effectiveFrom || fromPeriod;
  if (reportId === 11) {
    const rows = getReport11ForExport(ef, toPeriod, userStatus);
    const mapped = rows.map((r) =>
      Object.fromEntries(REPORT11_DISPLAY.map((d, i) => [d, r[REPORT11_HEADERS[i]]]))
    );
    return rowsToCsv(REPORT11_DISPLAY, mapped);
  }
  if (reportId === 12) {
    const rows = getReport12ForExport(ef, toPeriod, userStatus);
    const mapped = rows.map((r) =>
      Object.fromEntries(REPORT12_DISPLAY.map((d, i) => [d, r[REPORT12_HEADERS[i]]]))
    );
    return rowsToCsv(REPORT12_DISPLAY, mapped);
  }
  // Reports 1-10: placeholder CSV
  return '﻿Report ID ' + reportId + ' - Column specifications pending\r\n';
}

function csvFilename(reportId, name, from, to) {
  const safe = (s) => s.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${String(reportId).padStart(2, '0')}_${safe(name)}_${from}_${to}.csv`;
}

function exportSingleReport(res, reportId, fromPeriod, toPeriod, userStatus) {
  const report = REPORTS.find((r) => r.id === reportId);
  const csv = buildCsvForReport(reportId, fromPeriod, toPeriod, userStatus);
  const filename = csvFilename(reportId, report.name, fromPeriod, toPeriod);
  res.setHeader('Content-Type', 'text/csv; charset=UTF-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
}

function exportAllAsZip(res, fromPeriod, toPeriod, userStatus) {
  const zipFilename = `AuditLog_Export_${fromPeriod}_${toPeriod}.zip`;
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);

  const archive = archiver('zip', { zlib: { level: 6 } });
  archive.on('error', (err) => { throw err; });
  archive.pipe(res);

  // Clamp fromPeriod for reports 11 & 12 (silent, no error)
  const cutoff = new Date(Date.now() - 90 * 86400000);
  const fromDate = new Date(fromPeriod + 'T00:00:00');
  const clampedFrom = fromDate < cutoff
    ? cutoff.toISOString().slice(0, 10)
    : fromPeriod;

  REPORTS.forEach((report) => {
    const ef = report.maxDays !== null ? clampedFrom : fromPeriod;
    const csv = buildCsvForReport(report.id, fromPeriod, toPeriod, userStatus, ef);
    const filename = csvFilename(report.id, report.name, ef, toPeriod);
    archive.append(Buffer.from(csv, 'utf8'), { name: filename });
  });

  archive.finalize();
}

module.exports = { exportSingleReport, exportAllAsZip };
