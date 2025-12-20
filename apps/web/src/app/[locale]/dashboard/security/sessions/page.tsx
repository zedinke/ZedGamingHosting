'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './sessions.module.css';

interface Session {
  id: string;
  ip: string;
  userAgent: string;
  createdAt: string;
  lastActive: string;
  isCurrent: boolean;
}

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/sessions', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const data = await response.json();
      setSessions(data);
    } catch (err) {
      setError('Nem sikerült betölteni a munkameneteket');
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    if (!confirm('Biztosan visszavonod ezt a munkamenetet?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to revoke session');
      }

      // Refresh the list
      await fetchSessions();
    } catch (err) {
      setError('Nem sikerült visszavonni a munkamenetet');
      console.error('Error revoking session:', err);
    }
  };

  const revokeAllOther = async () => {
    if (!confirm('Biztosan visszavonod az összes többi munkamenetet?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/sessions/revoke-all', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to revoke sessions');
      }

      // Refresh the list
      await fetchSessions();
    } catch (err) {
      setError('Nem sikerült visszavonni a munkameneteket');
      console.error('Error revoking sessions:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('hu-HU');
  };

  const parseUserAgent = (ua: string) => {
    // Simple user agent parsing
    if (ua.includes('Chrome')) return { browser: 'Chrome', icon: '🌐' };
    if (ua.includes('Firefox')) return { browser: 'Firefox', icon: '🦊' };
    if (ua.includes('Safari')) return { browser: 'Safari', icon: '🧭' };
    if (ua.includes('Edge')) return { browser: 'Edge', icon: '🌐' };
    return { browser: 'Ismeretlen böngésző', icon: '💻' };
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Betöltés...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Aktív Munkamenetek</h1>
        <p>Kezeld a bejelentkezési munkameneteidet</p>
        {sessions.length > 1 && (
          <button onClick={revokeAllOther} className={styles.revokeAllBtn}>
            Összes többi munkamenet visszavonása
          </button>
        )}
      </div>

      {error && (
        <div className={styles.error}>{error}</div>
      )}

      <div className={styles.sessionsList}>
        {sessions.map((session) => {
          const { browser, icon } = parseUserAgent(session.userAgent);
          return (
            <div
              key={session.id}
              className={`${styles.sessionCard} ${session.isCurrent ? styles.current : ''}`}
            >
              <div className={styles.sessionIcon}>{icon}</div>
              <div className={styles.sessionInfo}>
                <h3>
                  {browser}
                  {session.isCurrent && <span className={styles.currentBadge}>Jelenlegi</span>}
                </h3>
                <div className={styles.details}>
                  <p>📍 IP: {session.ip}</p>
                  <p>🕐 Utoljára aktív: {formatDate(session.lastActive)}</p>
                  <p>📅 Létrehozva: {formatDate(session.createdAt)}</p>
                </div>
              </div>
              {!session.isCurrent && (
                <button
                  onClick={() => revokeSession(session.id)}
                  className={styles.revokeBtn}
                >
                  Visszavonás
                </button>
              )}
            </div>
          );
        })}
      </div>

      {sessions.length === 0 && !loading && (
        <div className={styles.empty}>
          Nincsenek aktív munkamenetek
        </div>
      )}
    </div>
  );
}
