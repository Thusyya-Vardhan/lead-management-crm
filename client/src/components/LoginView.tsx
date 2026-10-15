import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Layers, ArrowRight, AlertCircle, KeyRound, User, Shield } from 'lucide-react';

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
      setError(err.message || 'Authentication failed with selected demo role.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <div className="brand-badge" style={{ margin: '0 auto', width: '38px', height: '38px' }}>
            <Layers size={22} />
          </div>
          <h2>Mini CRM</h2>
          <p>Sign in to access your sales workspace</p>
        </div>

        {error && (
          <div className="alert alert-danger" id="login-error-alert">
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-email">Work Email</label>
            <input
              id="login-email"
              type="email"
              className="form-control"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="form-control"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            id="login-submit-btn"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.65rem' }}
            disabled={loading}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <div className="demo-switcher-container">
          <div className="demo-switcher-title">Instant Session Switcher</div>
          <div className="demo-account-grid">
            <button
              id="demo-admin-btn"
              type="button"
              className="demo-account-card"
              onClick={() => fillAndLogin('admin@minicrm.com', 'AdminPassword123!')}
              disabled={loading}
            >
              <div className="demo-account-role">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Shield size={12} style={{ color: '#c084fc' }} />
                  Admin
                </span>
                <KeyRound size={11} style={{ opacity: 0.5 }} />
              </div>
              <div className="demo-account-desc">Pipeline & approvals</div>
            </button>

            <button
              id="demo-employee-btn"
              type="button"
              className="demo-account-card"
              onClick={() => fillAndLogin('employee@minicrm.com', 'EmployeePassword123!')}
              disabled={loading}
            >
              <div className="demo-account-role">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <User size={12} style={{ color: '#38bdf8' }} />
                  Employee
                </span>
                <KeyRound size={11} style={{ opacity: 0.5 }} />
              </div>
              <div className="demo-account-desc">Assigned leads only</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
