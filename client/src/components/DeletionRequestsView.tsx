import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import type { DeletionRequest } from '../types';
import { apiFetch } from '../api';
import {
  RefreshCw,
  Building,
  Check,
  X,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldAlert,
} from 'lucide-react';

export const DeletionRequestsView: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const url =
        statusFilter === 'ALL'
          ? '/api/deletion-requests'
          : `/api/deletion-requests?status=${statusFilter}`;
      const data = await apiFetch<{
        success: boolean;
        deletionRequests: DeletionRequest[];
      }>(url);
      setRequests(data.deletionRequests || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch deletion requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  // Admin Approve Request
  const handleApprove = async (id: string, leadCompany: string) => {
    if (
      !window.confirm(
        `Approve deletion for "${leadCompany}"? The lead will be permanently deleted from the database.`
      )
    ) {
      return;
    }

    try {
      setProcessingId(id);
      await apiFetch(`/api/deletion-requests/${id}/approve`, {
        method: 'POST',
      });
      setActionSuccess(`Request approved. Lead record permanently removed.`);
      setTimeout(() => setActionSuccess(null), 4000);
      fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Failed to approve request');
    } finally {
      setProcessingId(null);
    }
  };

  // Admin Reject Request
  const handleReject = async (id: string, leadCompany: string) => {
    if (
      !window.confirm(
        `Reject deletion request for "${leadCompany}"? The lead will remain active in the pipeline.`
      )
    ) {
      return;
    }

    try {
      setProcessingId(id);
      await apiFetch(`/api/deletion-requests/${id}/reject`, {
        method: 'POST',
      });
      setActionSuccess(`Request rejected. Lead remains active in pipeline.`);
      setTimeout(() => setActionSuccess(null), 4000);
      fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Failed to reject request');
    } finally {
      setProcessingId(null);
    }
  };

  // KPI Metrics Calculations
  const metrics = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === 'PENDING').length;
    const approved = requests.filter((r) => r.status === 'APPROVED').length;
    const rejected = requests.filter((r) => r.status === 'REJECTED').length;
    return { total, pending, approved, rejected };
  }, [requests]);

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
          <h1 className="page-title">
            {user?.role === 'ADMIN' ? 'Deletion Approval Queue' : 'My Deletion Requests'}
          </h1>
          <p className="page-subtitle">
            {user?.role === 'ADMIN'
              ? 'Review employee justifications and authorize permanent lead removals'
              : 'Track the review status of leads you marked for deletion'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <button
            id="refresh-requests-btn"
            className="btn btn-secondary btn-sm"
            onClick={fetchRequests}
            disabled={loading}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">
            <span>Pending Review</span>
            <Clock size={14} style={{ color: 'var(--amber-text)' }} />
          </div>
          <div className="metric-value">{metrics.pending}</div>
          <div className="metric-subtext">
            <span>Requires administrative action</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            <span>Approved Removals</span>
            <CheckCircle2 size={14} style={{ color: 'var(--emerald-text)' }} />
          </div>
          <div className="metric-value">{metrics.approved}</div>
          <div className="metric-subtext">
            <span>Leads permanently expunged</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            <span>Rejected Tickets</span>
            <XCircle size={14} style={{ color: 'var(--rose-text)' }} />
          </div>
          <div className="metric-value">{metrics.rejected}</div>
          <div className="metric-subtext">
            <span>Leads preserved in pipeline</span>
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

      {/* Segmented Filter Bar */}
      <div className="toolbar-container">
        <div className="segmented-filters" role="tablist">
          {[
            { key: 'ALL', label: 'All Requests' },
            { key: 'PENDING', label: 'Pending Review' },
            { key: 'APPROVED', label: 'Approved' },
            { key: 'REJECTED', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`segmented-filter-btn ${statusFilter === tab.key ? 'active' : ''}`}
              onClick={() => setStatusFilter(tab.key)}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table Card */}
      <div className="card">
        <div className="table-responsive">
          <table className="data-table" id="deletion-requests-table">
            <thead>
              <tr>
                <th>Target Lead (Historical Snapshot)</th>
                <th>Company</th>
                {user?.role === 'ADMIN' && <th>Requested By</th>}
                <th>Reason Provided</th>
                <th>Status</th>
                <th>Submitted</th>
                {user?.role === 'ADMIN' && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading && requests.length === 0 ? (
                <tr>
                  <td colSpan={user?.role === 'ADMIN' ? 7 : 5} className="empty-state">
                    <div className="empty-state-icon">
                      <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                    <p style={{ fontWeight: 500 }}>Loading review queue...</p>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={user?.role === 'ADMIN' ? 7 : 5} className="empty-state">
                    <div className="empty-state-icon">
                      <ShieldAlert size={20} />
                    </div>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No deletion requests</p>
                    <p style={{ fontSize: '0.8rem', marginTop: '0.25rem', color: 'var(--text-tertiary)' }}>
                      {statusFilter !== 'ALL'
                        ? `No tickets currently match "${statusFilter}".`
                        : user?.role === 'ADMIN'
                        ? 'Queue clear! No employee removal requests awaiting review.'
                        : 'You have not submitted any deletion requests.'}
                    </p>
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req._id} id={`deletion-row-${req._id}`}>
                    <td>
                      <div className="lead-identity">
                        <div className="avatar-circle">{getInitials(req.leadName)}</div>
                        <div>
                          <div className="lead-name">{req.leadName}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                            Ref: {req.leadId.slice(-6)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
                        <Building size={13} style={{ color: 'var(--text-tertiary)' }} />
                        <span style={{ fontWeight: 500 }}>{req.leadCompany}</span>
                      </div>
                    </td>
                    {user?.role === 'ADMIN' && (
                      <td>
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
                            {req.requestedBy?.name ? getInitials(req.requestedBy.name) : 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                              {req.requestedBy?.name || 'Unknown'}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                              {req.requestedBy?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                    )}
                    <td>
                      <div
                        style={{
                          maxWidth: '280px',
                          fontSize: '0.8rem',
                          color: 'var(--text-primary)',
                          background: 'var(--bg-input)',
                          padding: '0.45rem 0.65rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {req.reason}
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill status-${req.status}`}>
                        <span className="status-dot" />
                        <span>{req.status}</span>
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    {user?.role === 'ADMIN' && (
                      <td style={{ textAlign: 'right' }}>
                        {req.status === 'PENDING' ? (
                          <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                            <button
                              id={`approve-request-${req._id}`}
                              className="btn btn-success btn-sm"
                              onClick={() => handleApprove(req._id, req.leadCompany)}
                              disabled={processingId === req._id}
                              title="Approve Deletion and Remove Lead"
                            >
                              <Check size={12} />
                              <span>Approve</span>
                            </button>
                            <button
                              id={`reject-request-${req._id}`}
                              className="btn btn-danger btn-sm"
                              onClick={() => handleReject(req._id, req.leadCompany)}
                              disabled={processingId === req._id}
                              title="Reject Request (Keep Lead)"
                            >
                              <X size={12} />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                            Resolved
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
