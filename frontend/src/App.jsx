import React, { useEffect, useState } from 'react';
import Navigation from './components/Navigation.jsx';
import AuditLogPage from './components/AuditLogPage.jsx';
import { checkAccess } from './services/auditLogApi.js';

export default function App() {
  const [hasAccess, setHasAccess] = useState(null); // null = loading
  const [activePage, setActivePage] = useState('home');

  useEffect(() => {
    checkAccess()
      .then((d) => setHasAccess(d.hasAccess))
      .catch(() => setHasAccess(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navigation
        hasAccess={hasAccess}
        activePage={activePage}
        onNavigate={setActivePage}
      />
      <main className="flex-1">
        {activePage === 'auditLog' ? (
          <AuditLogPage />
        ) : (
          <div className="p-8 text-gray-500 text-center mt-12">
            <p className="text-xl font-medium text-gray-400">Backoffice Home</p>
            <p className="text-sm mt-2">Click <strong>LOG REPORT</strong> in the navigation to open the Audit Log viewer.</p>
          </div>
        )}
      </main>
    </div>
  );
}
