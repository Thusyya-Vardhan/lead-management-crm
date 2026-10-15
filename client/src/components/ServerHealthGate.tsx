import React, { useState, useEffect } from 'react';
import { checkServerHealth } from '../api';
import { Layers, CheckCircle2, Clock } from 'lucide-react';

interface ServerHealthGateProps {
  children: React.ReactNode;
}

export const ServerHealthGate: React.FC<ServerHealthGateProps> = ({ children }) => {
  const [isServerReady, setIsServerReady] = useState<boolean>(false);
  const [isWakingUp, setIsWakingUp] = useState<boolean>(false);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    let timerInterval: ReturnType<typeof setInterval> | null = null;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    // Show the wake-up screen if initial health check takes longer than 2 seconds
    const slowThresholdTimeout = setTimeout(() => {
      if (isMounted && !isServerReady) {
        setIsWakingUp(true);
      }
    }, 2000);

    // Track elapsed time
    timerInterval = setInterval(() => {
      if (isMounted) {
        setSecondsElapsed((prev) => prev + 1);
      }
    }, 1000);

    const pingHealth = async () => {
      try {
        const res = await checkServerHealth();
        if (res && res.status === 'ok') {
          if (isMounted) {
            setIsServerReady(true);
            setIsWakingUp(false);
            if (pollInterval) clearInterval(pollInterval);
            if (timerInterval) clearInterval(timerInterval);
            clearTimeout(slowThresholdTimeout);
          }
        }
      } catch {
        if (isMounted) {
          setIsWakingUp(true);
        }
      }
    };

    // Initial ping immediately
    pingHealth();

    // Poll every 3.5 seconds until server responds
    pollInterval = setInterval(() => {
      if (!isServerReady) {
        pingHealth();
      }
    }, 3500);

    return () => {
      isMounted = false;
      clearTimeout(slowThresholdTimeout);
      if (timerInterval) clearInterval(timerInterval);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isServerReady]);

  // If server is ready, unlock the entire app
  if (isServerReady) {
    return <>{children}</>;
  }

  // If initial check took longer than 2s or server is sleeping, show the wake-up screen
  return (
    <div className="wakeup-wrapper">
      <div className="wakeup-card">
        <div className="wakeup-radar">
          <Layers size={32} />
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.025em' }}>
          Sales Lead Management CRM
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
          Connecting to cloud backend infrastructure
        </p>

        <div className="wakeup-status-badge">
          <span className="pulse-dot" />
          <span>Waking up cloud server...</span>
        </div>

        <p
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-tertiary)',
            lineHeight: 1.6,
            maxWidth: '380px',
            margin: '0 auto',
          }}
        >
          Render free-tier instances sleep when inactive. Waking the server and connecting MongoDB
          typically takes <strong>40–60 seconds</strong> on initial cold start.
        </p>

        {isWakingUp && (
          <div className="wakeup-timer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={12} />
              <span>{secondsElapsed}s elapsed — All operations paused until ready</span>
            </span>
          </div>
        )}

        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.725rem',
            color: 'var(--text-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
          }}
        >
          <CheckCircle2 size={13} style={{ color: 'var(--brand-primary)' }} />
          <span>Automatic redirect as soon as the API responds</span>
        </div>
      </div>
    </div>
  );
};
