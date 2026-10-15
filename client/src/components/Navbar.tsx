import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, FileText, UserCheck, LogOut, Shield, User as UserIcon } from 'lucide-react';

export type TabType = 'leads' | 'deletion-requests' | 'employees';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <header className="navbar">
      <div className="nav-brand">
        <div className="brand-icon">
          <Shield size={20} />
        </div>
        <span>Mini CRM</span>
      </div>

      <nav className="nav-tabs" aria-label="Main Navigation">
        <button
          id="tab-leads-btn"
          className={`nav-tab ${activeTab === 'leads' ? 'active' : ''}`}
          onClick={() => setActiveTab('leads')}
        >
          <Users size={16} />
          <span>Leads</span>
        </button>

        <button
          id="tab-deletion-requests-btn"
          className={`nav-tab ${activeTab === 'deletion-requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('deletion-requests')}
        >
          <FileText size={16} />
          <span>Deletion Requests</span>
        </button>

        {user.role === 'ADMIN' && (
          <button
            id="tab-employees-btn"
            className={`nav-tab ${activeTab === 'employees' ? 'active' : ''}`}
            onClick={() => setActiveTab('employees')}
          >
            <UserCheck size={16} />
            <span>Employees</span>
          </button>
        )}
      </nav>

      <div className="nav-user">
        <div className="user-badge" id="current-user-info">
          <UserIcon size={14} className="text-muted" />
          <span>{user.name}</span>
          <span className={`role-tag ${user.role.toLowerCase()}`}>
            {user.role}
          </span>
        </div>

        <button
          id="logout-btn"
          className="btn btn-secondary btn-sm"
          onClick={logout}
          title="Sign out of your account"
        >
          <LogOut size={14} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
