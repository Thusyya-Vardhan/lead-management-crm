import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type { DeletionRequest } from '../types';
import { apiFetch } from '../api';
import {
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  User,
  Building,
  Check,
  X,
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
    if (!window.confirm(`Approve deletion of lead for "${leadCompany}"? This will permanently delete the lead from the database.`)) {
      return;
    }

    try {
      setProcessingId(id);
      await apiFetch(`/api/deletion-requests/${id}/approve`, {
        method: 'POST',
      });
      setActionSuccess(`Deletion request approved. Lead has been permanently removed.`);
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
    if (!window.confirm(`Reject deletion request for "${leadCompany}"? The lead will remain active in the system.`)) {
      return;
    }

    try {
      setProcessingId(id);
      await apiFetch(`/api/deletion-requests/${id}/reject`, {
        method: 'POST',
      });
      setActionSuccess(`Deletion request rejected. Lead remains active in the pipeline.`);
      setTimeout(() => setActionSuccess(null), 4000);
      fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Failed to reject request');
    } finally {
      setProcessingId(null);
    }
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
              ? 'Review, approve, or reject lead removal requests submitted by employees'
              : 'Track the review status of leads you marked for deletion'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            id="refresh-requests-btn"
            className="btn btn-secondary"
            onClick={fetchRequests}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Action Notification */}
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

      {/* Filter Bar */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
            Filter by Status:
          </span>
          <select
            id="request-status-filter"
            className="form-control"
            style={{ width: 'auto' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Requests</option>
            <option value="PENDING">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Requests Table Card */}
      <div className="card">
        <div className="table-responsive">
          <table className="data-table" id="deletion-requests-table">
            <thead>
              <tr>
                <th>Target Lead (Snapshot)</th>
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
                    <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 0.5rem' }} />
                    <p>Loading deletion requests...</p>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={user?.role === 'ADMIN' ? 7 : 5} className="empty-state">
                    <p style={{ fontWeight: 600, fontSize: '1rem' }}>No deletion requests</p>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      {statusFilter !== 'ALL'
                        ? `No requests matching "${statusFilter}".`
                        : user?.role === 'ADMIN'
                        ? 'There are currently no deletion requests waiting in the queue.'
                        : 'You have not submitted any deletion requests.'}
                    </p>
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req._id} id={`deletion-row-${req._id}`}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{req.leadName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                        ID: {req.leadId}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Building size={14} style={{ color: 'var(--text-dim)' }} />
                        <span>{req.leadCompany}</span>
                      </div>
                    </td>
                    {user?.role === 'ADMIN' && (
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <User size={14} style={{ color: '#60a5fa' }} />
                          <div>
                            <div style={{ fontWeight: 500 }}>{req.requestedBy?.name || 'Unknown'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                              {req.requestedBy?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                    )}
                    <td>
                      <div
                        style={{
                          maxWidth: '260px',
                          fontSize: '0.85rem',
                          color: 'var(--text-main)',
                          background: 'var(--bg-input)',
                          padding: '0.4rem 0.6rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        {req.reason}
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill status-${req.status}`}>
                        {req.status === 'PENDING' && <Clock size={12} />}
                        {req.status === 'APPROVED' && <CheckCircle size={12} />}
                        {req.status === 'REJECTED' && <XCircle size={12} />}
                        <span>{req.status}</span>
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {new Date(req.createdAt).toLocaleString()}
                    </td>
                    {user?.role === 'ADMIN' && (
                      <td style={{ textAlign: 'right' }}>
                        {req.status === 'PENDING' ? (
                          <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                            <button
                              id={`approve-request-${req._id}`}
                              className="btn btn-success btn-sm"
                              onClick={() => handleApprove(req._id, req.leadCompany)}
                              disabled={processingId === req._id}
                              title="Approve Deletion and Remove Lead"
                            >
                              <Check size={14} />
                              <span>Approve</span>
                            </button>
                            <button
                              id={`reject-request-${req._id}`}
                              className="btn btn-danger btn-sm"
                              onClick={() => handleReject(req._id, req.leadCompany)}
                              disabled={processingId === req._id}
                              title="Reject Request (Keep Lead)"
                            >
                              <X size={14} />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
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
