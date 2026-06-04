import React, { useRef, useState } from 'react';
import { downloadAllZip } from '../../services/exportService.js';

function DateInput({ value, onChange, placeholder = 'YYYY-MM-DD' }) {
  const dateRef = useRef(null);
  return (
    <div className="relative flex items-center border border-gray-300 rounded bg-white overflow-hidden">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 text-sm outline-none"
        maxLength={10}
      />
      <input
        ref={dateRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 w-full cursor-pointer"
        tabIndex={-1}
      />
      <button
        type="button"
        onClick={() => dateRef.current?.showPicker?.()}
        className="px-2 py-2 border-l border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-500"
        tabIndex={-1}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>
    </div>
  );
}

const DEFAULT_FORM = { fromPeriod: '', toPeriod: '', userStatus: 'All' };

export default function ExportAllForm() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [status, setStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const [validationError, setValidationError] = useState('');

  function handleField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setValidationError('');
  }

  function handleReset() {
    setForm(DEFAULT_FORM);
    setValidationError('');
    setStatus(null);
    setErrorMsg('');
  }

  async function handleDownload(e) {
    e.preventDefault();
    // Client-side validation: from <= to
    if (form.fromPeriod && form.toPeriod && form.fromPeriod > form.toPeriod) {
      setValidationError('From Period must not be after To Period.');
      return;
    }
    setValidationError('');
    setStatus('loading');
    setErrorMsg('');
    try {
      await downloadAllZip({ fromPeriod: form.fromPeriod, toPeriod: form.toPeriod, userStatus: form.userStatus });
      setStatus('success');
      setTimeout(() => setStatus(null), 4000);
    } catch (e) {
      setStatus('error');
      setErrorMsg(e.message || 'Export failed. Please try again.');
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
      <p className="text-sm text-gray-600 mb-4">
        Export all 12 reports as a single ZIP file containing one CSV per report.
        Reports 11 &amp; 12 are automatically clamped to the last 90 days of available data.
      </p>

      <form onSubmit={handleDownload}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* From Period */}
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">From Period</label>
            <DateInput value={form.fromPeriod} onChange={(v) => handleField('fromPeriod', v)} />
          </div>

          {/* To Period */}
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">To Period</label>
            <DateInput value={form.toPeriod} onChange={(v) => handleField('toPeriod', v)} />
          </div>

          {/* User Status */}
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">User Status</label>
            <div className="flex items-center space-x-4 py-2">
              {['All', 'Enable', 'Disable'].map((s) => (
                <label key={s} className="flex items-center space-x-1.5 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="exportUserStatus"
                    value={s}
                    checked={form.userStatus === s}
                    onChange={() => handleField('userStatus', s)}
                    className="text-blue-600"
                  />
                  <span>{s}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Validation error */}
        {validationError && (
          <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {validationError}
          </div>
        )}

        {/* Status messages */}
        {status === 'success' && (
          <div className="mt-3 px-3 py-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
            ✓ ZIP file downloaded successfully.
          </div>
        )}
        {status === 'error' && (
          <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {errorMsg}
            <button
              type="button"
              onClick={handleDownload}
              className="ml-3 underline text-red-700 hover:text-red-900"
            >
              Retry
            </button>
          </div>
        )}

        {/* Buttons */}
        <div className="mt-4 flex items-center space-x-3">
          <button
            type="submit"
            disabled={status === 'loading'}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            {status === 'loading' ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Preparing ZIP...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download (ZIP)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={status === 'loading'}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50 text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Reset</span>
          </button>
        </div>
      </form>
    </div>
  );
}
