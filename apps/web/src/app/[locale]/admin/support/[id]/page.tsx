'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './edit.module.css';

interface TicketComment {
  id: string;
  message: string;
  author: { email: string };
  createdAt: string;
}

interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED';
  category?: string;
  user: { email: string };
  createdAt: string;
  comments: TicketComment[];
}

export default function AdminTicketEditPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;
  const locale = params.locale;

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    priority: 'MEDIUM' as const,
    status: 'OPEN' as const,
  });

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/support/tickets/${ticketId}`);
      if (!res.ok) throw new Error('Jegy nem található');
      const data = await res.json();
      setTicket(data);
      setForm({
        priority: data.priority,
        status: data.status,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba a jegy betöltésekor');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!ticket) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error('Mentés sikertelen');

      setSuccess('Jegy frissítve!');
      setTimeout(() => setSuccess(''), 3000);
      await fetchTicket();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba a mentés során');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async () => {
    if (!ticket) return;

    if (!window.confirm('Biztosan lezárod ezt a jegyet?')) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticketId}/close`, {
        method: 'PATCH',
      });

      if (!res.ok) throw new Error('Lezárás sikertelen');

      setSuccess('Jegy lezárva!');
      setTimeout(() => router.back(), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba a lezárás során');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Betöltés...</div>;
  }

  if (!ticket) {
    return <div className={styles.error}>{error || 'Jegy nem található'}</div>;
  }

  return (
    <div className={styles.container}>
      <button onClick={() => router.back()} className={styles.backButton}>
        ← Vissza
      </button>

      <div className={styles.header}>
        <div>
          <h1>{ticket.subject}</h1>
          <p className={styles.ticketNumber}>{ticket.ticketNumber}</p>
        </div>
        <div className={styles.headerActions}>
          <button
            onClick={handleClose}
            disabled={saving || ticket.status === 'CLOSED'}
            className={styles.closeButton}
          >
            Jegy Lezárása
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.content}>
        <div className={styles.section}>
          <h2>Jegy Adatok</h2>
          <div className={styles.infoGrid}>
            <div>
              <strong>Ügyfél Email:</strong>
              <p>{ticket.user.email}</p>
            </div>
            <div>
              <strong>Kategória:</strong>
              <p>{ticket.category || '-'}</p>
            </div>
            <div>
              <strong>Létrehozva:</strong>
              <p>
                {new Date(ticket.createdAt).toLocaleDateString(locale as string)}
              </p>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2>Leírás</h2>
          <div className={styles.description}>{ticket.description}</div>
        </div>

        <div className={styles.section}>
          <h2>Státusz Frissítés</h2>
          <div className={styles.formGroup}>
            <label>Prioritás</label>
            <select
              value={form.priority}
              onChange={(e) =>
                setForm({ ...form, priority: e.target.value as any })
              }
            >
              <option value="LOW">Alacsony</option>
              <option value="MEDIUM">Közepes</option>
              <option value="HIGH">Magas</option>
              <option value="CRITICAL">Kritikus</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Státusz</label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as any })
              }
            >
              <option value="OPEN">Nyitott</option>
              <option value="IN_PROGRESS">Feldolgozás alatt</option>
              <option value="WAITING_CUSTOMER">Várakozás</option>
              <option value="RESOLVED">Megoldva</option>
              <option value="CLOSED">Lezárva</option>
            </select>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className={styles.saveButton}
          >
            {saving ? 'Mentés...' : 'Frissítés Mentése'}
          </button>
        </div>

        <div className={styles.section}>
          <h2>Hozzászólások ({ticket.comments?.length || 0})</h2>
          {ticket.comments && ticket.comments.length > 0 ? (
            <div className={styles.commentsList}>
              {ticket.comments.map((c) => (
                <div key={c.id} className={styles.comment}>
                  <div className={styles.commentHeader}>
                    <strong>{c.author.email}</strong>
                    <span className={styles.commentDate}>
                      {new Date(c.createdAt).toLocaleDateString(locale as string)}
                    </span>
                  </div>
                  <p>{c.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.noComments}>Nincs hozzászólás</p>
          )}
        </div>
      </div>
    </div>
  );
}
