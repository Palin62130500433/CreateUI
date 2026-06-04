import React from 'react';

export default function Navigation({ hasAccess, activePage, onNavigate }) {
  return (
    <nav className="bg-blue-900 text-white shadow-md">
      <div className="max-w-screen-xl mx-auto px-4 flex items-center h-14">
        <span className="font-bold text-lg tracking-wide mr-8">BACKOFFICE</span>

        <div className="flex items-center space-x-1">
          <NavItem label="HOME" active={activePage === 'home'} onClick={() => onNavigate('home')} />

          {hasAccess === null && (
            <span className="px-4 py-2 text-sm text-blue-300 italic">Loading...</span>
          )}

          {hasAccess === true && (
            <NavItem
              label="LOG REPORT"
              active={activePage === 'auditLog'}
              onClick={() => onNavigate('auditLog')}
            />
          )}
        </div>

        <div className="ml-auto text-sm text-blue-300">
          Logged in as: <span className="text-white font-medium">admin</span>
        </div>
      </div>
    </nav>
  );
}

function NavItem({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
        active
          ? 'bg-blue-700 text-white'
          : 'text-blue-200 hover:bg-blue-800 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}
