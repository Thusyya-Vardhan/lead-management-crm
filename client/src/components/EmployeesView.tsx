import React, { useState, useEffect, useMemo } from 'react';
import type { User } from '../types';
import { apiFetch } from '../api';
import {
  UserPlus,
  RefreshCw,
  X,
  Search,
  CheckCircle2,
  Users,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export const EmployeesView: React.FC = () => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch<{ success: boolean; employees: User[] }>('/api/employees');
      setEmployees(data.employees || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/employees', {
        method: 'POST',
        body: JSON.stringify(form),
      });

      setIsModalOpen(false);
      setForm({ name: '', email: '', password: '' });
      setActionSuccess(`Account for "${form.name}" successfully provisioned.`);
      setTimeout(() => setActionSuccess(null), 4000);
      fetchEmployees();
    } catch (err: any) {
      alert(err.message || 'Failed to create employee');
    }
  };

  const filteredEmployees = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return employees;
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q)
    );
  }, [employees, searchQuery]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="main-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff Directory</h1>
          <p className="page-subtitle">
            Manage sales team accounts, credentials, and lead assignment eligibility
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <button
            id="refresh-employees-btn"
            className="btn btn-secondary btn-sm"
            onClick={fetchEmployees}
            disabled={loading}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            id="add-employee-btn"
            className="btn btn-primary btn-sm"
            onClick={() => setIsModalOpen(true)}
          >
            <UserPlus size={14} />
            <span>Provision Account</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">
            <span>Total Sales Reps</span>
            <Users size={14} style={{ color: 'var(--brand-primary)' }} />
          </div>
          <div className="metric-value">{employees.length}</div>
          <div className="metric-subtext">
            <span>Available for lead assignment</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            <span>Active Accounts</span>
            <CheckCircle2 size={14} style={{ color: 'var(--emerald-text)' }} />
          </div>
          <div className="metric-value">{employees.filter((e) => e.isActive).length}</div>
          <div className="metric-subtext">
            <span>Enabled login sessions</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            <span>Authorization Level</span>
            <ShieldCheck size={14} style={{ color: '#38bdf8' }} />
          </div>
          <div className="metric-value" style={{ fontSize: '1.25rem', marginTop: '0.65rem' }}>
            EMPLOYEE
          </div>
          <div className="metric-subtext">
            <span>Row-level isolated visibility</span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="alert alert-success">
          <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="toolbar-container">
        <div className="search-box">
          <Search size={14} className="search-box-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '0.65rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Employees Table Card */}
      <div className="card">
        <div className="table-responsive">
          <table className="data-table" id="employees-table">
            <thead>
              <tr>
                <th>Sales Representative</th>
                <th>Work Email</th>
                <th>Access Role</th>
                <th>Status</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {loading && employees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    <div className="empty-state-icon">
                      <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                    <p style={{ fontWeight: 500 }}>Loading staff directory...</p>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    <div className="empty-state-icon">
                      <Users size={20} />
                    </div>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No employees found</p>
                    <p style={{ fontSize: '0.8rem', marginTop: '0.25rem', color: 'var(--text-tertiary)' }}>
                      {searchQuery
                        ? 'No staff member matches your search filter.'
                        : 'Click "Provision Account" above to add sales representatives to your workspace.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp._id} id={`employee-row-${emp._id}`}>
                    <td>
                      <div className="lead-identity">
                        <div
                          className="avatar-circle"
                          style={{
                            background: 'rgba(56, 189, 248, 0.12)',
                            color: '#38bdf8',
                            borderColor: 'rgba(56, 189, 248, 0.25)',
                          }}
                        >
                          {getInitials(emp.name)}
                        </div>
                        <div>
                          <div className="lead-name">{emp.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                            ID: {emp._id.slice(-6)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                      {emp.email}
                    </td>
                    <td>
                      <span className="role-tag employee">
                        {emp.role}
                      </span>
                    </td>
                    <td>
                      <span className="status-pill status-APPROVED">
                        <span className="status-dot" />
                        <span>{emp.isActive ? 'Active' : 'Disabled'}</span>
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
                      {emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD EMPLOYEE MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal" id="add-employee-modal">
            <div className="modal-header">
              <div>
                <h3>Provision Staff Account</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Create login credentials for a new sales representative
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsModalOpen(false)}
                style={{ padding: '0.2rem 0.4rem' }}
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="create-emp-name">Full Name *</label>
                  <input
                    id="create-emp-name"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Alex Morgan"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="create-emp-email">Corporate Email *</label>
                  <input
                    id="create-emp-email"
                    type="email"
                    className="form-control"
                    placeholder="alex@minicrm.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="create-emp-password">Initial Password (min 6 characters) *</label>
                  <input
                    id="create-emp-password"
                    type="password"
                    className="form-control"
                    placeholder="••••••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-create-employee-btn"
                  className="btn btn-primary btn-sm"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
