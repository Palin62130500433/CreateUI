import React, { useEffect, useState } from 'react';
import FilterForm from './ViewLogReport/FilterForm.jsx';
import ExportAllForm from './ExportAllForm/index.jsx';
import ReportTab from './ReportTab/index.jsx';
import { getReports, queryReport } from '../services/auditLogApi.js';

const DEFAULT_FORM = {
  reportId: 1,
  fromPeriod: '',
  toPeriod: '',
  userStatus: 'All',
};
const PAGE_SIZE = 50;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoStr(days) {
  const d = new Date(Date.now() - days * 86400000);
  return d.toISOString().slice(0, 10);
}

// Auto-fill dates for Report 11/12 (last 90 days)
function autoFillDates(reportId) {
  if (reportId === 11 || reportId === 12) {
    return { fromPeriod: daysAgoStr(90), toPeriod: todayStr() };
  }
  return { fromPeriod: '', toPeriod: '' };
}

function validateForm(form) {
  if (form.fromPeriod && form.toPeriod && form.fromPeriod > form.toPeriod) {
    return 'From Period must not be after To Period.';
  }
  return null;
}

export default function AuditLogPage() {
  const [reports, setReports] = useState([]);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [activeTab, setActiveTab] = useState('viewLogReport');
  const [reportTabs, setReportTabs] = useState([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    getReports()
      .then((d) => {
        setReports(d.reports);
        setForm((f) => ({ ...f, reportId: d.reports[0]?.id || 1 }));
      })
      .catch(() => {});
  }, []);

  function handleFormChange(newForm) {
    // When report changes to 11 or 12, auto-fill dates to last 90 days (FR-012)
    if (newForm.reportId !== form.reportId) {
      const dates = autoFillDates(newForm.reportId);
      setForm({ ...newForm, ...dates });
    } else {
      setForm(newForm);
    }
    setValidationError('');
  }

  function handleReset() {
    const firstReportId = reports[0]?.id || 1;
    const dates = autoFillDates(firstReportId);
    setForm({ ...DEFAULT_FORM, reportId: firstReportId, ...dates });
    setValidationError('');
    // Report tabs remain open (FR-010)
  }

  async function handleSubmit() {
    const err = validateForm(form);
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError('');
    setSubmitLoading(true);

    const report = reports.find((r) => r.id === form.reportId);
    const filterCriteria = {
      fromPeriod: form.fromPeriod,
      toPeriod: form.toPeriod,
      userStatus: form.userStatus,
    };

    // Open or update the tab immediately with loading state
    setReportTabs((prev) => {
      const exists = prev.find((t) => t.reportId === form.reportId);
      if (exists) {
        return prev.map((t) =>
          t.reportId === form.reportId
            ? { ...t, loading: true, error: null, filterCriteria }
            : t
        );
      }
      return [
        ...prev,
        {
          reportId: form.reportId,
          reportName: report?.name || String(form.reportId),
          filterCriteria,
          data: [],
          totalCount: 0,
          page: 1,
          pageSize: PAGE_SIZE,
          loading: true,
          error: null,
        },
      ];
    });
    setActiveTab(String(form.reportId));

    try {
      const result = await queryReport(form.reportId, filterCriteria, 1, PAGE_SIZE);
      setReportTabs((prev) =>
        prev.map((t) =>
          t.reportId === form.reportId
            ? {
                ...t,
                data: result.data,
                totalCount: result.totalCount,
                page: result.page,
                pageSize: result.pageSize,
                loading: false,
                error: null,
                filterCriteria,
              }
            : t
        )
      );
    } catch (e) {
      const errMsg = e.message || 'Query failed.';
      if (e.error === 'INVALID_DATE_RANGE') {
        setReportTabs((prev) => prev.filter((t) => t.reportId !== form.reportId));
        setActiveTab('viewLogReport');
        setValidationError(errMsg);
      } else {
        setReportTabs((prev) =>
          prev.map((t) =>
            t.reportId === form.reportId ? { ...t, loading: false, error: errMsg } : t
          )
        );
      }
    } finally {
      setSubmitLoading(false);
    }
  }

  function handleTabUpdate(reportId, patch) {
    setReportTabs((prev) =>
      prev.map((t) => (t.reportId === reportId ? { ...t, ...patch } : t))
    );
  }

  function handleCloseTab(reportId) {
    setReportTabs((prev) => {
      const remaining = prev.filter((t) => t.reportId !== reportId);
      if (activeTab === String(reportId)) {
        setActiveTab(remaining.length > 0 ? String(remaining[remaining.length - 1].reportId) : 'viewLogReport');
      }
      return remaining;
    });
  }

  const tabs = [
    { id: 'viewLogReport', label: 'View Log Report' },
    { id: 'exportAll', label: 'Export All' },
    ...reportTabs.map((t) => ({ id: String(t.reportId), label: `${t.reportId}. ${t.reportName}`, closeable: true, reportId: t.reportId })),
  ];

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6">
      {/* Page title */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-800">LOG REPORT</h1>
        <p className="text-sm text-gray-500">REPORT TAB</p>
      </div>

      {/* Tab bar */}
      <div className="border-b border-gray-300 flex items-end space-x-1 overflow-x-auto">
        {tabs.map((tab) => (
          <div key={tab.id} className="flex items-center group">
            <button
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-t border-l border-r rounded-t whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-white border-gray-300 text-blue-800 border-b-white -mb-px z-10'
                  : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-50 mb-px'
              }`}
            >
              {tab.label}
            </button>
            {tab.closeable && (
              <button
                onClick={(e) => { e.stopPropagation(); handleCloseTab(tab.reportId); }}
                className={`ml-0.5 mr-1 text-gray-400 hover:text-red-500 text-sm leading-none pb-1 ${
                  activeTab === tab.id ? '' : 'opacity-0 group-hover:opacity-100'
                }`}
                title="Close tab"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white border border-t-0 border-gray-300 rounded-b-lg shadow-sm min-h-96">
        {activeTab === 'viewLogReport' && (
          <div className="p-5">
            <FilterForm
              reports={reports}
              form={form}
              onChange={handleFormChange}
              onSubmit={handleSubmit}
              onReset={handleReset}
              loading={submitLoading}
              validationError={validationError}
            />
          </div>
        )}

        {activeTab === 'exportAll' && (
          <div className="p-5">
            <ExportAllForm />
          </div>
        )}

        {reportTabs.map((tab) =>
          activeTab === String(tab.reportId) ? (
            <ReportTab key={tab.reportId} tab={tab} onUpdate={handleTabUpdate} />
          ) : null
        )}
      </div>
    </div>
  );
}
