import React, { useRef } from 'react';

function DateInput({ label, value, onChange, placeholder = 'YYYY-MM-DD' }) {
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
      {/* Hidden native date input for calendar picker */}
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

export default function FilterForm({ reports, form, onChange, onSubmit, onReset, loading, validationError }) {
  function handleField(field, value) {
    onChange({ ...form, [field]: value });
  }

  const selectedReport = reports.find((r) => r.id === form.reportId);
  const isLimited = selectedReport?.maxDays != null;

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
      className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Report List */}
        <div className="flex flex-col space-y-1">
          <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Report List</label>
          <select
            value={form.reportId}
            onChange={(e) => handleField('reportId', parseInt(e.target.value))}
            className="border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {reports.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id}. {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* From Period */}
        <div className="flex flex-col space-y-1">
          <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">From Period</label>
          <DateInput value={form.fromPeriod} onChange={(v) => handleField('fromPeriod', v)} />
          {isLimited && (
            <span className="text-xs text-amber-600">Auto-set: last {selectedReport.maxDays} days</span>
          )}
        </div>

        {/* To Period */}
        <div className="flex flex-col space-y-1">
          <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">To Period</label>
          <DateInput value={form.toPeriod} onChange={(v) => handleField('toPeriod', v)} />
          {isLimited && (
            <span className="text-xs text-amber-600">Data clamped to last {selectedReport.maxDays} days</span>
          )}
        </div>

        {/* User Status */}
        <div className="flex flex-col space-y-1">
          <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">User Status</label>
          <div className="flex items-center space-x-4 py-2">
            {['All', 'Enable', 'Disable'].map((s) => (
              <label key={s} className="flex items-center space-x-1.5 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="userStatus"
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

      {/* Actions */}
      <div className="mt-4 flex items-center space-x-3">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Searching...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Submit</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onReset}
          disabled={loading}
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
  );
}
