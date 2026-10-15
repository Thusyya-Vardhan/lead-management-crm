import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillAndLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setLoading(true);

    try {
      await login(demoEmail, demoPass);
    } catch (err: any) {
      setError(err.message || 'Login failed with demo credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <div className="brand-icon" style={{ margin: '0 auto', width: 'fit-content', padding: '0.75rem' }}>
            <Shield size={32} />
          </div>
          <h2>Mini CRM</h2>
          <p>Sign in to your lead management dashboard</p>
        </div>

        {error && (
          <div className="alert alert-danger" id="login-error-alert" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-email"
                type="email"
                className="form-control"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type="password"
                className="form-control"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            id="login-submit-btn"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? (
              <span>Signing In...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="demo-accounts">
          <div className="demo-accounts-title">Quick Demo Logins</div>
          <div className="demo-btn-group">
            <button
              id="demo-admin-btn"
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fillAndLogin('admin@minicrm.com', 'AdminPassword123!')}
              disabled={loading}
            >
              <KeyRound size={12} />
              <span>Admin Demo</span>
            </button>
            <button
              id="demo-employee-btn"
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fillAndLogin('employee@minicrm.com', 'EmployeePassword123!')}
              disabled={loading}
            >
              <KeyRound size={12} />
              <span>Employee Demo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
