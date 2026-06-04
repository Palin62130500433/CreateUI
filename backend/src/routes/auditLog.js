const express = require('express');
const router = express.Router();
const { queryReport, validateDateRange, clampFromPeriod } = require('../services/auditLogService');
const { exportSingleReport, exportAllAsZip } = require('../services/exportService');
const { permissions, REPORTS } = require('../data/mockData');

// Auth guard — checks has_audit_log_access for current user
function requireAccess(req, res, next) {
  if (!permissions[req.currentUser]) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  next();
}

// 1. Check access
router.get('/access', (req, res) => {
  res.json({ hasAccess: !!permissions[req.currentUser] });
});

// 2. Report list
router.get('/reports', requireAccess, (_req, res) => {
  res.json({ reports: REPORTS });
});

// 3. Query report (paginated)
router.post('/reports/:reportId/query', requireAccess, (req, res) => {
  const reportId = parseInt(req.params.reportId);
  if (!reportId || reportId < 1 || reportId > 12) {
    return res.status(400).json({ error: 'INVALID_REPORT_ID', message: 'reportId must be 1–12.' });
  }

  const { fromPeriod, toPeriod, userStatus = 'All', page = 1, pageSize = 50 } = req.body;
  const result = queryReport(reportId, { fromPeriod, toPeriod, userStatus, page, pageSize });

  if (result.validationError) {
    return res.status(400).json(result.validationError);
  }

  const report = REPORTS.find((r) => r.id === reportId);
  res.json({
    reportId,
    reportName: report.name,
    fromPeriod: result.effectiveFromPeriod || fromPeriod || '',
    toPeriod: toPeriod || '',
    ...result,
  });
});

// 4. Export single report as CSV
router.post('/reports/:reportId/export', requireAccess, (req, res) => {
  const reportId = parseInt(req.params.reportId);
  if (!reportId || reportId < 1 || reportId > 12) {
    return res.status(400).json({ error: 'INVALID_REPORT_ID' });
  }

  const { fromPeriod, toPeriod, userStatus = 'All' } = req.body;
  const maxDays = reportId >= 11 ? 90 : null;
  const rangeErr = validateDateRange(fromPeriod, toPeriod, maxDays);
  if (rangeErr) return res.status(400).json(rangeErr);

  try {
    exportSingleReport(res, reportId, fromPeriod, toPeriod, userStatus);
  } catch (e) {
    res.status(500).json({ error: 'EXPORT_FAILED', message: 'Export failed. Please try again.' });
  }
});

// 5. Export all reports as ZIP
router.post('/export-all', requireAccess, (req, res) => {
  const { fromPeriod, toPeriod, userStatus = 'All' } = req.body;
  const rangeErr = validateDateRange(fromPeriod, toPeriod, null); // only from <= to check
  if (rangeErr) return res.status(400).json(rangeErr);

  try {
    exportAllAsZip(res, fromPeriod || '2000-01-01', toPeriod || new Date().toISOString().slice(0, 10), userStatus);
  } catch (e) {
    res.status(500).json({ error: 'EXPORT_FAILED', message: 'Export failed. Please try again.' });
  }
});

// 6. Get user permission
router.get('/permissions/:username', requireAccess, (req, res) => {
  const { username } = req.params;
  res.json({ username, hasAuditLogAccess: !!permissions[username] });
});

// 7. Update user permission
router.put('/permissions/:username', requireAccess, (req, res) => {
  const { username } = req.params;
  const { hasAuditLogAccess } = req.body;
  permissions[username] = !!hasAuditLogAccess;
  res.json({ username, hasAuditLogAccess: permissions[username], updatedAt: new Date().toISOString() });
});

module.exports = router;
