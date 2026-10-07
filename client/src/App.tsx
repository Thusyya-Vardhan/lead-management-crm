import { useEffect, useState } from 'react';

interface HealthResponse {
  status: string;
  db: string;
  timestamp: string;
}

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: HealthResponse) => {
        setHealth(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Mini CRM</h1>
      <p>Phase 1: Foundation Verification</p>

      <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', marginTop: '1rem' }}>
        <h3>Backend Health Check</h3>
        {loading && <p>Checking backend connection...</p>}
        {error && <p style={{ color: 'red' }}>❌ Error connecting to server: {error}</p>}
        {health && (
          <div>
            <p><strong>Server Status:</strong> {health.status === 'ok' ? '✅ Online' : '⚠️ Warning'}</p>
            <p><strong>MongoDB:</strong> {health.db === 'connected' ? '✅ Connected' : '❌ Disconnected'}</p>
            <p><small>Checked at: {new Date(health.timestamp).toLocaleTimeString()}</small></p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
