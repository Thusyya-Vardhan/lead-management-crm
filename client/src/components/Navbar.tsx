import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, FileText, UserCheck, LogOut, Layers } from 'lucide-react';

export type TabType = 'leads' | 'deletion-requests' | 'employees';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <header className="navbar">
      <div className="nav-brand">
        <div className="brand-badge">
          <Layers size={17} />
        </div>
        <div className="brand-text">
          <span>Lead Management Dashboard</span>
          <span className="brand-version">v1.0</span>
        </div>
      </div>

      <nav className="nav-tabs" aria-label="Main Navigation">
        <button
          id="tab-leads-btn"
          className={`nav-tab ${activeTab === 'leads' ? 'active' : ''}`}
          onClick={() => setActiveTab('leads')}
        >
          <Users size={15} />
          <span>Leads Pipeline</span>
        </button>

        <button
          id="tab-deletion-requests-btn"
          className={`nav-tab ${activeTab === 'deletion-requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('deletion-requests')}
        >
          <FileText size={15} />
          <span>Approval Queue</span>
        </button>

        {user.role === 'ADMIN' && (
          <button
            id="tab-employees-btn"
            className={`nav-tab ${activeTab === 'employees' ? 'active' : ''}`}
            onClick={() => setActiveTab('employees')}
          >
            <UserCheck size={15} />
            <span>Staff Directory</span>
          </button>
        )}
      </nav>

      <div className="nav-user">
        <div className="user-badge" id="current-user-info">
          <div className="user-avatar-sm">{initials}</div>
          <span style={{ color: 'var(--text-primary)' }}>{user.name}</span>
          <span className={`role-tag ${user.role.toLowerCase()}`}>
            {user.role}
          </span>
        </div>

        <button
          id="logout-btn"
          className="btn btn-ghost btn-sm"
          onClick={logout}
          title="Sign out of your account"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
};
