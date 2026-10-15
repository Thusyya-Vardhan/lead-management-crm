import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Lead, LeadStatus, User } from '../types';
import { apiFetch } from '../api';
import {
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Building,
  RefreshCw,
  X,
  Search,
  CheckCircle2,
  TrendingUp,
  Target,
  Sparkles,
} from 'lucide-react';

export const LeadsView: React.FC = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [occError, setOccError] = useState<string | null>(null);
  const [deletionModalLead, setDeletionModalLead] = useState<Lead | null>(null);
  const [deletionReason, setDeletionReason] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Create Form State
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'NEW' as LeadStatus,
    assignedTo: '',
    notes: '',
  });

  // Edit Form State
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'NEW' as LeadStatus,
    assignedTo: '',
    notes: '',
    __v: 0,
  });

  // Fetch leads
  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch<{ success: boolean; leads: Lead[] }>('/api/leads');
      setLeads(data.leads || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  // Fetch employees for assignment (Admin only)
  const fetchEmployees = async () => {
    if (user?.role !== 'ADMIN') return;
    try {
      const data = await apiFetch<{ success: boolean; employees: User[] }>('/api/employees');
      setEmployees(data.employees || []);
    } catch (err) {
      console.error('Failed to fetch employees list:', err);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchEmployees();
  }, [user]);

  // Open Edit Modal with pre-filled lead data
  const handleOpenEdit = (lead: Lead) => {
    setEditingLead(lead);
    setOccError(null);
    setEditForm({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      status: lead.status,
      assignedTo: lead.assignedTo?._id || '',
      notes: lead.notes || '',
      __v: lead.__v,
    });
  };

  // Reload latest version of the lead if OCC error occurred
  const handleReloadLead = async () => {
    if (!editingLead) return;
    try {
      const data = await apiFetch<{ success: boolean; lead: Lead }>(`/api/leads/${editingLead._id}`);
      const freshLead = data.lead;
      setEditingLead(freshLead);
      setEditForm({
        name: freshLead.name,
        email: freshLead.email,
        phone: freshLead.phone,
        company: freshLead.company,
        status: freshLead.status,
        assignedTo: freshLead.assignedTo?._id || '',
        notes: freshLead.notes || '',
        __v: freshLead.__v,
      });
      setOccError(null);
    } catch (err: any) {
      setOccError('Failed to reload fresh lead data: ' + err.message);
    }
  };

  // Create Lead (Admin only)
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/leads', {
        method: 'POST',
        body: JSON.stringify({
          ...newLead,
          assignedTo: newLead.assignedTo ? newLead.assignedTo : null,
        }),
      });
      setIsCreateOpen(false);
      setNewLead({
        name: '',
        email: '',
        phone: '',
        company: '',
        status: 'NEW',
        assignedTo: '',
        notes: '',
      });
      setActionSuccess('Lead created and added to pipeline.');
      setTimeout(() => setActionSuccess(null), 3500);
      fetchLeads();
    } catch (err: any) {
      alert(err.message || 'Failed to create lead');
    }
  };

  // Update Lead (Includes OCC __v check)
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;

    try {
      const payload: any = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        company: editForm.company,
        status: editForm.status,
        notes: editForm.notes,
        __v: editForm.__v,
      };

      if (user?.role === 'ADMIN') {
        payload.assignedTo = editForm.assignedTo ? editForm.assignedTo : null;
      }

      await apiFetch(`/api/leads/${editingLead._id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      setEditingLead(null);
      setActionSuccess('Lead record successfully updated.');
      setTimeout(() => setActionSuccess(null), 3500);
      fetchLeads();
    } catch (err: any) {
      if (err.status === 409) {
        setOccError(
          'Concurrency Collision (OCC): Another team member edited this lead. Reload the latest changes below.'
        );
      } else {
        alert(err.message || 'Failed to update lead');
      }
    }
  };

  // Admin Direct Delete
  const handleDeleteDirect = async (lead: Lead) => {
    if (!window.confirm(`Permanently delete "${lead.name}" (${lead.company})? This action cannot be reversed.`)) {
      return;
    }

    try {
      await apiFetch(`/api/leads/${lead._id}`, {
        method: 'DELETE',
      });
      setActionSuccess('Lead permanently removed from database.');
      setTimeout(() => setActionSuccess(null), 3500);
      fetchLeads();
    } catch (err: any) {
      alert(err.message || 'Failed to delete lead');
    }
  };

  // Employee Submit Deletion Request
  const handleSubmitDeletionRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletionModalLead || !deletionReason.trim()) return;

    try {
      await apiFetch('/api/deletion-requests', {
        method: 'POST',
        body: JSON.stringify({
          leadId: deletionModalLead._id,
          reason: deletionReason.trim(),
        }),
      });

      setDeletionModalLead(null);
      setDeletionReason('');
      setActionSuccess('Deletion request submitted to Admin queue.');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to submit deletion request');
    }
  };

  // KPI Metrics Calculations
  const metrics = useMemo(() => {
    const total = leads.length;
    const newLeads = leads.filter((l) => l.status === 'NEW').length;
    const inPipeline = leads.filter(
      (l) => l.status === 'QUALIFIED' || l.status === 'PROPOSAL_SENT' || l.status === 'CONTACTED'
    ).length;
    const closedWon = leads.filter((l) => l.status === 'CLOSED_WON').length;
    const winRate = total > 0 ? Math.round((closedWon / total) * 100) : 0;

    return { total, newLeads, inPipeline, closedWon, winRate };
  }, [leads]);

  // Status Counts for Segmented Tabs
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: leads.length,
      NEW: 0,
      CONTACTED: 0,
      QUALIFIED: 0,
      PROPOSAL_SENT: 0,
      CLOSED_WON: 0,
      CLOSED_LOST: 0,
    };
    leads.forEach((l) => {
      if (counts[l.status] !== undefined) {
        counts[l.status]++;
      }
    });
    return counts;
  }, [leads]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesStatus = statusFilter === 'ALL' || lead.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        lead.name.toLowerCase().includes(q) ||
        lead.company.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q) ||
        (lead.assignedTo && lead.assignedTo.name.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [leads, searchQuery, statusFilter]);

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
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {user?.role === 'ADMIN' ? 'Pipeline Overview' : 'Assigned Accounts'}
          </h1>
          <p className="page-subtitle">
            {user?.role === 'ADMIN'
              ? 'Track customer conversions, allocate sales reps, and manage company leads'
              : 'View and update your active sales conversations'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <button
            id="refresh-leads-btn"
            className="btn btn-secondary btn-sm"
            onClick={fetchLeads}
            disabled={loading}
            title="Refresh Leads"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          {user?.role === 'ADMIN' && (
            <button
              id="create-lead-btn"
              className="btn btn-primary btn-sm"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus size={14} />
              <span>Create Lead</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">
            <span>Total Leads</span>
            <Target size={14} style={{ color: 'var(--brand-primary)' }} />
          </div>
          <div className="metric-value">{metrics.total}</div>
          <div className="metric-subtext">
            <span>{user?.role === 'ADMIN' ? 'In company pipeline' : 'Assigned to your queue'}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            <span>Active Pipeline</span>
            <TrendingUp size={14} style={{ color: '#38bdf8' }} />
          </div>
          <div className="metric-value">{metrics.inPipeline}</div>
          <div className="metric-subtext">
            <span>Contacted, qualified & proposals</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            <span>Closed Won</span>
            <CheckCircle2 size={14} style={{ color: '#34d399' }} />
          </div>
          <div className="metric-value">{metrics.closedWon}</div>
          <div className="metric-subtext">
            <span style={{ color: '#34d399', fontWeight: 600 }}>{metrics.winRate}%</span>
            <span>win rate</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            <span>New Leads</span>
            <Sparkles size={14} style={{ color: '#fbbf24' }} />
          </div>
          <div className="metric-value">{metrics.newLeads}</div>
          <div className="metric-subtext">
            <span>Awaiting initial contact</span>
          </div>
        </div>
      </div>

      {/* Action Notification */}
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

      {/* Toolbar: Search + Segmented Filter Tabs */}
      <div className="toolbar-container">
        <div className="search-box">
          <Search size={14} className="search-box-icon" />
          <input
            id="lead-search-input"
            type="text"
            className="form-control"
            placeholder="Search leads, companies, emails..."
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

        <div className="segmented-filters" role="tablist">
          {[
            { key: 'ALL', label: 'All' },
            { key: 'NEW', label: 'New' },
            { key: 'CONTACTED', label: 'Contacted' },
            { key: 'QUALIFIED', label: 'Qualified' },
            { key: 'PROPOSAL_SENT', label: 'Proposal' },
            { key: 'CLOSED_WON', label: 'Won' },
            { key: 'CLOSED_LOST', label: 'Lost' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`segmented-filter-btn ${statusFilter === tab.key ? 'active' : ''}`}
              onClick={() => setStatusFilter(tab.key)}
            >
              <span>{tab.label}</span>
              <span className="filter-count">{statusCounts[tab.key] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Leads Table Card */}
      <div className="card">
        <div className="table-responsive">
          <table className="data-table" id="leads-table">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Company</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Assigned Rep</th>
                <th>Updated</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">
                    <div className="empty-state-icon">
                      <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                    <p style={{ fontWeight: 500 }}>Syncing pipeline...</p>
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">
                    <div className="empty-state-icon">
                      <Target size={20} />
                    </div>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No leads found</p>
                    <p style={{ fontSize: '0.8rem', marginTop: '0.25rem', color: 'var(--text-tertiary)' }}>
                      {searchQuery || statusFilter !== 'ALL'
                        ? 'Try clearing your search query or selecting a different status filter.'
                        : user?.role === 'ADMIN'
                        ? 'Click "Create Lead" above to register your first prospective customer.'
                        : 'No leads are currently assigned to your employee account.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead._id} id={`lead-row-${lead._id}`}>
                    <td>
                      <div className="lead-identity">
                        <div className="avatar-circle">{getInitials(lead.name)}</div>
                        <div>
                          <div className="lead-name">{lead.name}</div>
                          {lead.notes && <div className="lead-sub">{lead.notes}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
                        <Building size={13} style={{ color: 'var(--text-tertiary)' }} />
                        <span style={{ fontWeight: 500 }}>{lead.company}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ color: 'var(--text-primary)', fontSize: '0.8rem' }}>{lead.email}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{lead.phone}</div>
                    </td>
                    <td>
                      <span className={`status-pill status-${lead.status}`}>
                        <span className="status-dot" />
                        <span>{lead.status.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td>
                      {lead.assignedTo ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <div
                            style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              background: 'rgba(56, 189, 248, 0.15)',
                              color: '#38bdf8',
                              fontSize: '0.6rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {getInitials(lead.assignedTo.name)}
                          </div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                            {lead.assignedTo.name}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                          — Unassigned —
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
                      {new Date(lead.updatedAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          id={`edit-lead-${lead._id}`}
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEdit(lead)}
                          title="Edit Lead"
                        >
                          <Edit2 size={12} />
                          <span>Edit</span>
                        </button>

                        {user?.role === 'ADMIN' ? (
                          <button
                            id={`delete-lead-${lead._id}`}
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteDirect(lead)}
                            title="Direct Delete Lead"
                          >
                            <Trash2 size={12} />
                          </button>
                        ) : (
                          <button
                            id={`request-delete-lead-${lead._id}`}
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                              setDeletionModalLead(lead);
                              setDeletionReason('');
                            }}
                            title="Request Deletion"
                          >
                            <Trash2 size={12} />
                            <span>Request Deletion</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE LEAD MODAL (Admin Only) */}
      {isCreateOpen && (
        <div className="modal-overlay">
          <div className="modal" id="create-lead-modal">
            <div className="modal-header">
              <div>
                <h3>Create New Lead</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Register a prospective client in the sales pipeline
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsCreateOpen(false)}
                style={{ padding: '0.2rem 0.4rem' }}
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="create-lead-name">Lead Full Name *</label>
                  <input
                    id="create-lead-name"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Sarah Connor"
                    value={newLead.name}
                    onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="create-lead-company">Company Name *</label>
                  <input
                    id="create-lead-company"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Cyberdyne Systems"
                    value={newLead.company}
                    onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label htmlFor="create-lead-email">Email Address *</label>
                    <input
                      id="create-lead-email"
                      type="email"
                      className="form-control"
                      placeholder="sarah@example.com"
                      value={newLead.email}
                      onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="create-lead-phone">Phone Number *</label>
                    <input
                      id="create-lead-phone"
                      type="text"
                      className="form-control"
                      placeholder="+1 (555) 019-2834"
                      value={newLead.phone}
                      onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label htmlFor="create-lead-status">Initial Status</label>
                    <select
                      id="create-lead-status"
                      className="form-control"
                      value={newLead.status}
                      onChange={(e) => setNewLead({ ...newLead, status: e.target.value as LeadStatus })}
                    >
                      <option value="NEW">New</option>
                      <option value="CONTACTED">Contacted</option>
                      <option value="QUALIFIED">Qualified</option>
                      <option value="PROPOSAL_SENT">Proposal Sent</option>
                      <option value="CLOSED_WON">Closed Won</option>
                      <option value="CLOSED_LOST">Closed Lost</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="create-lead-assignedTo">Assign Sales Rep</label>
                    <select
                      id="create-lead-assignedTo"
                      className="form-control"
                      value={newLead.assignedTo}
                      onChange={(e) => setNewLead({ ...newLead, assignedTo: e.target.value })}
                    >
                      <option value="">— Unassigned —</option>
                      {employees.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.name} ({emp.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="create-lead-notes">Internal Notes</label>
                  <textarea
                    id="create-lead-notes"
                    className="form-control"
                    rows={2}
                    placeholder="Key pain points, meeting summary, or deal size..."
                    value={newLead.notes}
                    onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" id="submit-create-lead-btn" className="btn btn-primary btn-sm">
                  Create Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT LEAD MODAL (OCC Protected) */}
      {editingLead && (
        <div className="modal-overlay">
          <div className="modal" id="edit-lead-modal">
            <div className="modal-header">
              <div>
                <h3>Edit: {editingLead.name}</h3>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
                  Document revision: v{editForm.__v}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setEditingLead(null)}
                style={{ padding: '0.2rem 0.4rem' }}
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                {/* OCC Conflict Warning Alert */}
                {occError && (
                  <div
                    className="alert alert-danger"
                    id="occ-conflict-alert"
                    style={{ marginBottom: '1.25rem' }}
                  >
                    <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{occError}</div>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={handleReloadLead}
                        style={{ marginTop: '0.5rem' }}
                      >
                        <RefreshCw size={11} />
                        <span>Reload Fresh Version</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="edit-lead-name">Lead Full Name</label>
                  <input
                    id="edit-lead-name"
                    type="text"
                    className="form-control"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-lead-company">Company Name</label>
                  <input
                    id="edit-lead-company"
                    type="text"
                    className="form-control"
                    value={editForm.company}
                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label htmlFor="edit-lead-email">Email Address</label>
                    <input
                      id="edit-lead-email"
                      type="email"
                      className="form-control"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-lead-phone">Phone Number</label>
                    <input
                      id="edit-lead-phone"
                      type="text"
                      className="form-control"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label htmlFor="edit-lead-status">Pipeline Stage</label>
                    <select
                      id="edit-lead-status"
                      className="form-control"
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as LeadStatus })}
                    >
                      <option value="NEW">New</option>
                      <option value="CONTACTED">Contacted</option>
                      <option value="QUALIFIED">Qualified</option>
                      <option value="PROPOSAL_SENT">Proposal Sent</option>
                      <option value="CLOSED_WON">Closed Won</option>
                      <option value="CLOSED_LOST">Closed Lost</option>
                    </select>
                  </div>

                  {user?.role === 'ADMIN' ? (
                    <div className="form-group">
                      <label htmlFor="edit-lead-assignedTo">Reassign Rep (Admin)</label>
                      <select
                        id="edit-lead-assignedTo"
                        className="form-control"
                        value={editForm.assignedTo}
                        onChange={(e) => setEditForm({ ...editForm, assignedTo: e.target.value })}
                      >
                        <option value="">— Unassigned —</option>
                        {employees.map((emp) => (
                          <option key={emp._id} value={emp._id}>
                            {emp.name} ({emp.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="form-group">
                      <label>Assigned Rep</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editingLead.assignedTo ? editingLead.assignedTo.name : 'Unassigned'}
                        disabled
                        style={{ opacity: 0.6 }}
                      />
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="edit-lead-notes">Conversation Notes</label>
                  <textarea
                    id="edit-lead-notes"
                    className="form-control"
                    rows={3}
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setEditingLead(null)}
                >
                  Cancel
                </button>
                <button type="submit" id="submit-edit-lead-btn" className="btn btn-primary btn-sm">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUEST DELETION MODAL (Employee Flow) */}
      {deletionModalLead && (
        <div className="modal-overlay">
          <div className="modal" id="request-deletion-modal">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={16} style={{ color: 'var(--amber-text)' }} />
                <h3>Request Lead Removal</h3>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setDeletionModalLead(null)}
                style={{ padding: '0.2rem 0.4rem' }}
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSubmitDeletionRequest}>
              <div className="modal-body">
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Lead removal requires administrative review. Please specify why this lead should be deleted from the pipeline.
                </p>

                <div
                  style={{
                    background: 'var(--bg-input)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: '1rem',
                    fontSize: '0.8rem',
                  }}
                >
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>Lead:</strong> {deletionModalLead.name}
                  </div>
                  <div style={{ marginTop: '0.2rem' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Company:</strong> {deletionModalLead.company}
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="deletion-reason-input">Reason for Deletion *</label>
                  <textarea
                    id="deletion-reason-input"
                    className="form-control"
                    rows={3}
                    placeholder="e.g. Duplicate customer record, company closed down, or requested removal..."
                    value={deletionReason}
                    onChange={(e) => setDeletionReason(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setDeletionModalLead(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-deletion-request-btn"
                  className="btn btn-danger btn-sm"
                  disabled={!deletionReason.trim()}
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
