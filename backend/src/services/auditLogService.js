const { report11Data, report12Data } = require('../data/mockData');

function parseDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr + 'T00:00:00');
}

function daysBetween(from, to) {
  return Math.floor((to - from) / (1000 * 60 * 60 * 24));
}

function filterRecords(records, dateField, fromPeriod, toPeriod, userStatus) {
  const from = parseDate(fromPeriod);
  const to = toPeriod ? new Date(toPeriod + 'T23:59:59.999') : null;

  return records.filter((r) => {
    // Date range filter
    if (from || to) {
      const ts = new Date(r[dateField].replace(' ', 'T'));
      if (from && ts < from) return false;
      if (to && ts > to) return false;
    }
    // User status filter
    if (userStatus && userStatus !== 'All') {
      if (r.userStatus !== userStatus) return false;
    }
    return true;
  });
}

function paginate(records, page, pageSize) {
  const p = Math.max(1, parseInt(page) || 1);
  const ps = Math.max(1, parseInt(pageSize) || 50);
  const start = (p - 1) * ps;
  return {
    data: records.slice(start, start + ps),
    totalCount: records.length,
    page: p,
    pageSize: ps,
  };
}

function validateDateRange(fromPeriod, toPeriod, maxDays) {
  if (!fromPeriod || !toPeriod) return null;
  const from = parseDate(fromPeriod);
  const to = parseDate(toPeriod);
  if (from > to) return { error: 'INVALID_DATE_RANGE', message: 'fromPeriod must not be after toPeriod.' };
  if (maxDays !== null) {
    const days = daysBetween(from, to);
    if (days > maxDays) {
      return {
        error: 'DATE_RANGE_EXCEEDED',
        message: `Report ${maxDays === 90 ? '11/12' : ''} allows a maximum of ${maxDays} days lookback. Requested range: ${days} days.`,
      };
    }
  }
  return null;
}

function clampFromPeriod(fromPeriod, maxDaysBack) {
  if (!fromPeriod) return fromPeriod;
  const cutoff = new Date(Date.now() - maxDaysBack * 86400000);
  const from = parseDate(fromPeriod);
  if (from < cutoff) {
    const y = cutoff.getFullYear();
    const m = String(cutoff.getMonth() + 1).padStart(2, '0');
    const d = String(cutoff.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return fromPeriod;
}

function queryReport(reportId, { fromPeriod, toPeriod, userStatus, page, pageSize }) {
  const id = parseInt(reportId);

  // Validate from <= to only (no 90-day block for Reports 11/12 — clamp instead)
  const rangeErr = validateDateRange(fromPeriod, toPeriod, null);
  if (rangeErr) return { validationError: rangeErr };

  // For Reports 11/12: silently clamp fromPeriod to max(fromPeriod, today - 90)
  const effectiveFrom = id >= 11 ? clampFromPeriod(fromPeriod, 90) : fromPeriod;

  let filtered;
  if (id === 11) {
    filtered = filterRecords(report11Data, 'loginDatetime', effectiveFrom, toPeriod, userStatus);
  } else if (id === 12) {
    // userStatus filter does not apply to Audit Log — status here is resultStatus (SUCCESS/FAILED)
    filtered = filterRecords(report12Data, 'actionDate', effectiveFrom, toPeriod, null);
  } else {
    // Reports 1-10: column specs pending — return empty placeholder
    filtered = [];
  }

  // Sort descending by date
  filtered.sort((a, b) => {
    const da = id === 11 ? a.loginDatetime : (a.actionDate || '');
    const db = id === 11 ? b.loginDatetime : (b.actionDate || '');
    return db.localeCompare(da);
  });

  const result = paginate(filtered, page, pageSize);
  // Expose the effective from period so UI can show the actual clamped date
  result.effectiveFromPeriod = effectiveFrom || fromPeriod;
  return result;
}

function getReport11ForExport(fromPeriod, toPeriod, userStatus) {
  return filterRecords(report11Data, 'loginDatetime', fromPeriod, toPeriod, userStatus);
}

function getReport12ForExport(fromPeriod, toPeriod) {
  return filterRecords(report12Data, 'actionDate', fromPeriod, toPeriod, null);
}

module.exports = { queryReport, getReport11ForExport, getReport12ForExport, validateDateRange, clampFromPeriod };
