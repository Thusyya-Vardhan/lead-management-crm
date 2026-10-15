import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Lead, LeadStatus, User } from '../types';
import { apiFetch } from '../api';
import {
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  UserCheck,
  Building,
  RefreshCw,
  X,
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
      setActionSuccess('Lead created successfully!');
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
      setActionSuccess('Lead updated successfully!');
      setTimeout(() => setActionSuccess(null), 3500);
      fetchLeads();
    } catch (err: any) {
      if (err.status === 409) {
        setOccError(
          'Concurrency Conflict (OCC): Another user modified this lead while you were editing it. Please reload the latest changes before saving.'
        );
      } else {
        alert(err.message || 'Failed to update lead');
      }
    }
  };

  // Admin Direct Delete
  const handleDeleteDirect = async (lead: Lead) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${lead.name}" (${lead.company})?`)) {
      return;
    }

    try {
      await apiFetch(`/api/leads/${lead._id}`, {
        method: 'DELETE',
      });
      setActionSuccess('Lead permanently deleted.');
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
      setActionSuccess('Deletion request submitted for Admin review.');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to submit deletion request');
    }
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesStatus = statusFilter === 'ALL' || lead.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        lead.name.toLowerCase().includes(q) ||
        lead.company.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q) ||
        (lead.assignedTo && lead.assignedTo.name.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [leads, searchQuery, statusFilter]);

  return (
    <div className="main-content">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {user?.role === 'ADMIN' ? 'All Leads Pipeline' : 'My Assigned Leads'}
          </h1>
          <p className="page-subtitle">
            {user?.role === 'ADMIN'
              ? 'Manage sales leads, assign owners, and track conversions'
              : 'Track and update your currently assigned customer leads'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            id="refresh-leads-btn"
            className="btn btn-secondary"
            onClick={fetchLeads}
            disabled={loading}
            title="Refresh Leads"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          {user?.role === 'ADMIN' && (
            <button
              id="create-lead-btn"
              className="btn btn-primary"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus size={16} />
              <span>New Lead</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Notification */}
      {actionSuccess && (
        <div className="alert" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '1.5rem' }}>
          {actionSuccess}
        </div>
      )}

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          marginBottom: '1.5rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', flex: '1', maxWidth: '420px', position: 'relative' }}>
          <input
            id="lead-search-input"
            type="text"
            className="form-control"
            placeholder="Search leads by name, company, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
            Status:
          </span>
          <select
            id="lead-status-filter"
            className="form-control"
            style={{ width: 'auto' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="PROPOSAL_SENT">Proposal Sent</option>
            <option value="CLOSED_WON">Closed Won</option>
            <option value="CLOSED_LOST">Closed Lost</option>
          </select>
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
                <th>Assigned To</th>
                <th>Updated</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">
                    <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 0.5rem' }} />
                    <p>Loading leads pipeline...</p>
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">
                    <p style={{ fontWeight: 600, fontSize: '1rem' }}>No leads found</p>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      {searchQuery || statusFilter !== 'ALL'
                        ? 'Try clearing your search query or filter.'
                        : user?.role === 'ADMIN'
                        ? 'Click "New Lead" above to create your first pipeline lead.'
                        : 'No leads are currently assigned to your account.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead._id} id={`lead-row-${lead._id}`}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{lead.name}</div>
                      {lead.notes && (
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-dim)',
                            maxWidth: '220px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {lead.notes}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Building size={14} style={{ color: 'var(--text-dim)' }} />
                        <span>{lead.company}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem' }}>{lead.email}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{lead.phone}</div>
                    </td>
                    <td>
                      <span className={`status-pill status-${lead.status}`}>
                        {lead.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      {lead.assignedTo ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <UserCheck size={14} style={{ color: '#60a5fa' }} />
                          <span style={{ fontSize: '0.85rem' }}>{lead.assignedTo.name}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {new Date(lead.updatedAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          id={`edit-lead-${lead._id}`}
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEdit(lead)}
                          title="Edit Lead"
                        >
                          <Edit2 size={13} />
                          <span>Edit</span>
                        </button>

                        {user?.role === 'ADMIN' ? (
                          <button
                            id={`delete-lead-${lead._id}`}
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteDirect(lead)}
                            title="Direct Delete Lead"
                          >
                            <Trash2 size={13} />
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
                            <Trash2 size={13} />
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
              <h3>Create New Lead</h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsCreateOpen(false)}
                style={{ padding: '0.2rem 0.5rem' }}
              >
                <X size={16} />
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                    <label htmlFor="create-lead-assignedTo">Assign To Employee</label>
                    <select
                      id="create-lead-assignedTo"
                      className="form-control"
                      value={newLead.assignedTo}
                      onChange={(e) => setNewLead({ ...newLead, assignedTo: e.target.value })}
                    >
                      <option value="">-- Unassigned --</option>
                      {employees.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.name} ({emp.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
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
                  className="btn btn-secondary"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" id="submit-create-lead-btn" className="btn btn-primary">
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
                <h3>Edit Lead: {editingLead.name}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Document Version: v{editForm.__v}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setEditingLead(null)}
                style={{ padding: '0.2rem 0.5rem' }}
              >
                <X size={16} />
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
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong>{occError}</strong>
                        <div style={{ marginTop: '0.5rem' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={handleReloadLead}
                          >
                            <RefreshCw size={12} />
                            <span>Reload Latest Changes</span>
                          </button>
                        </div>
                      </div>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label htmlFor="edit-lead-status">Lead Status</label>
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
                      <label htmlFor="edit-lead-assignedTo">Reassign Employee (Admin)</label>
                      <select
                        id="edit-lead-assignedTo"
                        className="form-control"
                        value={editForm.assignedTo}
                        onChange={(e) => setEditForm({ ...editForm, assignedTo: e.target.value })}
                      >
                        <option value="">-- Unassigned --</option>
                        {employees.map((emp) => (
                          <option key={emp._id} value={emp._id}>
                            {emp.name} ({emp.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="form-group">
                      <label>Assigned To</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editingLead.assignedTo ? editingLead.assignedTo.name : 'Unassigned'}
                        disabled
                        style={{ opacity: 0.7 }}
                      />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="edit-lead-notes">Notes</label>
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
                  className="btn btn-secondary"
                  onClick={() => setEditingLead(null)}
                >
                  Cancel
                </button>
                <button type="submit" id="submit-edit-lead-btn" className="btn btn-primary">
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
                <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
                <h3>Request Lead Deletion</h3>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setDeletionModalLead(null)}
                style={{ padding: '0.2rem 0.5rem' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitDeletionRequest}>
              <div className="modal-body">
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  As an employee, deletion requires administrative approval. Please provide a clear rationale for removing this lead.
                </p>

                <div
                  style={{
                    background: 'var(--bg-input)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    marginBottom: '1rem',
                    fontSize: '0.85rem',
                  }}
                >
                  <div>
                    <strong>Lead:</strong> {deletionModalLead.name}
                  </div>
                  <div>
                    <strong>Company:</strong> {deletionModalLead.company}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="deletion-reason-input">Reason for Deletion *</label>
                  <textarea
                    id="deletion-reason-input"
                    className="form-control"
                    rows={3}
                    placeholder="e.g., Duplicate record, client went out of business, or requested GDPR erasure..."
                    value={deletionReason}
                    onChange={(e) => setDeletionReason(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDeletionModalLead(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-deletion-request-btn"
                  className="btn btn-danger"
                  disabled={!deletionReason.trim()}
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
