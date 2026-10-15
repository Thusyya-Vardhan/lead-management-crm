import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ServerHealthGate } from './components/ServerHealthGate';
import { Navbar, type TabType } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { LeadsView } from './components/LeadsView';
import { DeletionRequestsView } from './components/DeletionRequestsView';
import { EmployeesView } from './components/EmployeesView';
import { Layers } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('leads');

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-main)',
          color: 'var(--text-secondary)',
          gap: '1rem',
        }}
      >
        <div className="brand-badge" style={{ width: '42px', height: '42px' }}>
          <Layers size={22} />
        </div>
        <p style={{ fontSize: '0.8rem', letterSpacing: '0.04em', color: 'var(--text-tertiary)' }}>
          Restoring session...
        </p>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="app-container">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main>
        {activeTab === 'leads' && <LeadsView />}
        {activeTab === 'deletion-requests' && <DeletionRequestsView />}
        {activeTab === 'employees' && user.role === 'ADMIN' && <EmployeesView />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <ServerHealthGate>
      <AuthProvider>
        <DashboardContent />
      </AuthProvider>
    </ServerHealthGate>
  );
}
