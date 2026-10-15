import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { apiFetch } from '../api';
import {
  UserPlus,
  RefreshCw,
  Mail,
  CheckCircle,
  X,
  User as UserIcon,
} from 'lucide-react';

export const EmployeesView: React.FC = () => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

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
      setActionSuccess(`Employee "${form.name}" created successfully!`);
      setTimeout(() => setActionSuccess(null), 4000);
      fetchEmployees();
    } catch (err: any) {
      alert(err.message || 'Failed to create employee');
    }
  };

  return (
    <div className="main-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Employee Management</h1>
          <p className="page-subtitle">
            Provision staff accounts, manage credentials, and view active sales team members
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            id="refresh-employees-btn"
            className="btn btn-secondary"
            onClick={fetchEmployees}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            id="add-employee-btn"
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
          >
            <UserPlus size={16} />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div
          className="alert"
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            marginBottom: '1.5rem',
          }}
        >
          {actionSuccess}
        </div>
      )}

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Employees Table Card */}
      <div className="card">
        <div className="table-responsive">
          <table className="data-table" id="employees-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Email Address</th>
                <th>Assigned Role</th>
                <th>Status</th>
                <th>Account Created</th>
              </tr>
            </thead>
            <tbody>
              {loading && employees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 0.5rem' }} />
                    <p>Loading employee directory...</p>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    <p style={{ fontWeight: 600, fontSize: '1rem' }}>No employees registered</p>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      Click "Add Employee" above to provision a sales representative account.
                    </p>
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp._id} id={`employee-row-${emp._id}`}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div
                          style={{
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: '#60a5fa',
                            padding: '0.4rem',
                            borderRadius: '50%',
                            display: 'flex',
                          }}
                        >
                          <UserIcon size={16} />
                        </div>
                        <span style={{ fontWeight: 600 }}>{emp.name}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                        <Mail size={14} />
                        <span>{emp.email}</span>
                      </div>
                    </td>
                    <td>
                      <span className="role-tag employee">
                        {emp.role}
                      </span>
                    </td>
                    <td>
                      <span
                        className="status-pill status-APPROVED"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <CheckCircle size={12} />
                        <span>{emp.isActive ? 'Active' : 'Inactive'}</span>
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
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
              <h3>Provision New Employee</h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsModalOpen(false)}
                style={{ padding: '0.2rem 0.5rem' }}
              >
                <X size={16} />
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

                <div className="form-group">
                  <label htmlFor="create-emp-password">Initial Password (min 6 chars) *</label>
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
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-create-employee-btn"
                  className="btn btn-primary"
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
