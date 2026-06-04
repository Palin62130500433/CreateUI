import React, { useState } from 'react';
import Report11Table from './Report11Table.jsx';
import Report12Table from './Report12Table.jsx';
import Pagination from '../DataTable/Pagination.jsx';
import { downloadReportCsv } from '../../services/exportService.js';
import { queryReport } from '../../services/auditLogApi.js';

function Spinner() {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function ReportTab({ tab, onUpdate }) {
  const { reportId, reportName, filterCriteria, data, totalCount, page, pageSize, loading, error } = tab;

  const [exportStatus, setExportStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [exportError, setExportError] = useState('');

  async function handleExport() {
    setExportStatus('loading');
    setExportError('');
    try {
      await downloadReportCsv(reportId, filterCriteria);
      setExportStatus('success');
      setTimeout(() => setExportStatus(null), 3000);
    } catch (e) {
      setExportStatus('error');
      setExportError(e.message || 'Export failed. Please try again.');
    }
  }

  async function handlePageChange(newPage) {
    onUpdate(reportId, { loading: true, error: null });
    try {
      const result = await queryReport(reportId, filterCriteria, newPage, pageSize);
      onUpdate(reportId, {
        data: result.data,
        totalCount: result.totalCount,
        page: result.page,
        loading: false,
      });
    } catch (e) {
      onUpdate(reportId, { loading: false, error: e.message || 'Query failed.' });
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Report Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          <span className="font-semibold">Report:</span> {reportId}. {reportName}
          {filterCriteria.fromPeriod && filterCriteria.toPeriod && (
            <span className="ml-4">
              <span className="font-semibold">Date:</span>{' '}
              {filterCriteria.fromPeriod} to {filterCriteria.toPeriod}
            </span>
          )}
        </div>

        {/* Export icon */}
        <div className="flex items-center space-x-2">
          {exportStatus === 'success' && (
            <span className="text-green-600 text-xs">✓ Export success</span>
          )}
          {exportStatus === 'error' && (
            <span className="text-red-600 text-xs">{exportError}</span>
          )}
          <button
            onClick={handleExport}
            disabled={exportStatus === 'loading' || loading}
            title="Export to CSV"
            className="flex items-center space-x-1 px-3 py-1.5 border border-gray-300 rounded text-sm bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {exportStatus === 'loading' ? (
              <span className="text-gray-500 text-xs">Exporting...</span>
            ) : (
              <>
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                <span>Export CSV</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Table content */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <Spinner />
        ) : error ? (
          <div className="text-center text-red-600 py-10">{error}</div>
        ) : reportId >= 1 && reportId <= 10 ? (
          <div className="text-center text-gray-400 py-12">
            <p className="text-base font-medium">Report {reportId}. {reportName}</p>
            <p className="text-sm mt-2 text-gray-400">Column specifications for Reports 1–10 are pending (Phase E).</p>
          </div>
        ) : reportId === 11 ? (
          <Report11Table rows={data} />
        ) : (
          <Report12Table rows={data} />
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && data && (reportId === 11 || reportId === 12) && (
        <Pagination
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
