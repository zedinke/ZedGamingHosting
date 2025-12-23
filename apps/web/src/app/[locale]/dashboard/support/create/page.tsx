'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styles from './create.module.css';

interface CreateTicketForm {
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category?: string;
}

const categories = [
  { value: 'billing', label: 'Számlázás' },
  { value: 'technical', label: 'Technikai' },
  { value: 'general', label: 'Általános' },
  { value: 'feature-request', label: 'Funkció Kérés' },
];

export default function CreateSupportTicketPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale;

  const [form, setForm] = useState<CreateTicketForm>({
    subject: '',
    description: '',
    priority: 'MEDIUM',
    category: 'general',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.subject.trim()) {
      setError('A tárgy megadása szükséges');
      return;
    }

    if (!form.description.trim()) {
      setError('A leírás megadása szükséges');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state.accessToken : null;
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create ticket');
      }

      const ticket = await res.json();
      setSuccess(true);

      // Redirect to ticket detail after success
      setTimeout(() => {
        router.push(`/${locale}/dashboard/support/${ticket.id}`);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Új Támogatási Jegy</h1>
        <p>Írj le egy problémát, és a csapatunk hamarosan válaszolni fog</p>
      </div>

      {success && (
        <div className={styles.success}>
          ✓ Jegy sikeresen létrehozva! Átirányítás...
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="category">Kategória</label>
          <select
            id="category"
            value={form.category}
            onChange={(e) =>
              setForm({ ...form, category: e.target.value })
            }
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="subject">Tárgy *</label>
          <input
            id="subject"
            type="text"
            placeholder="Rövid összefoglalás a problémáról"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            maxLength={200}
          />
          <small>
            {form.subject.length}/200
          </small>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description">Leírás *</label>
          <textarea
            id="description"
            placeholder="Részletesen írd le a problémádat..."
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            rows={8}
          />
          <small>
            {form.description.length} karakter
          </small>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="priority">Prioritás</label>
          <select
            id="priority"
            value={form.priority}
            onChange={(e) =>
              setForm({
                ...form,
                priority: e.target.value as any,
              })
            }
          >
            <option value="LOW">Alacsony</option>
            <option value="MEDIUM">Közepes</option>
            <option value="HIGH">Magas</option>
            <option value="CRITICAL">Kritikus</option>
          </select>
        </div>

        <div className={styles.formActions}>
          <button
            type="submit"
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? 'Létrehozás...' : 'Jegy Létrehozása'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className={styles.cancelButton}
          >
            Mégse
          </button>
        </div>
      </form>
    </div>
  );
}
