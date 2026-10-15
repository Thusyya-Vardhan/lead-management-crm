import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar, type TabType } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { LeadsView } from './components/LeadsView';
import { DeletionRequestsView } from './components/DeletionRequestsView';
import { EmployeesView } from './components/EmployeesView';
import { Shield } from 'lucide-react';

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
          color: 'var(--text-muted)',
          gap: '1rem',
        }}
      >
        <div className="brand-icon" style={{ padding: '1rem' }}>
          <Shield size={36} />
        </div>
        <p style={{ fontSize: '0.9rem', letterSpacing: '0.05em' }}>INITIALIZING MINI CRM SESSION...</p>
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
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
