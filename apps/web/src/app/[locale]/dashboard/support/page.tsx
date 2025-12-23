'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from '@i18n/translations';
import { useHydrated } from '@/hooks/use-hydrated';
import styles from './support.module.css';
import { getAccessToken, getRefreshToken } from '@/lib/get-access-token';
import { useAuthStore } from '@/stores/auth-store';

interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  comments: { id: string; message: string; author: any }[];
}

const priorityColors = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  HIGH: '#ef4444',
  CRITICAL: '#7c3aed',
};

const statusTexts = {
  OPEN: 'Nyitott',
  IN_PROGRESS: 'Feldolgozás alatt',
  WAITING_CUSTOMER: 'Várakozás',
  RESOLVED: 'Megoldva',
  CLOSED: 'Lezárva',
};

export default function SupportTicketsPage() {
  const locale = useLocale();
  const router = useRouter();
  const hydrated = useHydrated();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    // Dependency array with page change
    const load = async () => {
      if (!hydrated) {
        console.log('[Support] Not hydrated yet, waiting...');
        return;
      }

      const token = getAccessToken();
      console.log('[Support] Token:', token ? 'present' : 'missing');
      
      if (!token) {
        setError('Token nincs elérhető. Kérjük jelentkezzen be újra.');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        let res = await fetch(`/api/support/tickets?page=${page}&limit=10`, {
          headers: {
            'Accept-Language': locale,
            Authorization: `Bearer ${token}`,
          },
        });

        // If unauthorized, try to refresh the access token once
        if (res.status === 401) {
          console.warn('[Support] 401 Unauthorized. Attempting token refresh...');
          const refreshToken = getRefreshToken();
          if (refreshToken) {
            const refreshRes = await fetch(`/api/auth/refresh`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept-Language': locale,
              },
              body: JSON.stringify({ refreshToken }),
            });

            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              const newAccessToken = refreshData?.accessToken as string | undefined;
              if (newAccessToken) {
                // Update Zustand store tokens so the whole app sees the new token
                useAuthStore.getState().updateTokens(newAccessToken, refreshToken);
                console.log('[Support] Access token refreshed. Retrying request.');
                res = await fetch(`/api/support/tickets?page=${page}&limit=10`, {
                  headers: {
                    'Accept-Language': locale,
                    Authorization: `Bearer ${newAccessToken}`,
                  },
                });
              }
            } else {
              const errBody = await refreshRes.json().catch(() => ({}));
              console.warn('[Support] Token refresh failed:', errBody?.message || refreshRes.status);
            }
          } else {
            console.warn('[Support] No refresh token available.');
          }
        }
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
          throw new Error(errorData.message || 'Failed to fetch tickets');
        }
        
        const data = await res.json();
        setTickets(data.tickets || []);
        setTotal(data.pagination?.total || 0);
        setError('');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error loading tickets';
        console.error('[Support] Exception:', message);
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    
    load();
  }, [page, locale, hydrated]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Támogatási Jegyek</h1>
        <Link
          href={`/${locale}/dashboard/support/create`}
          className={styles.createButton}
        >
          + Új Jegy
        </Link>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Betöltés...</div>
      ) : tickets.length === 0 ? (
        <div className={styles.empty}>
          <p>Nincsenek támogatási jegyeid</p>
          <Link href={`/${locale}/dashboard/support/create`}>
            Hozz létre egyet most
          </Link>
        </div>
      ) : (
        <>
          <div className={styles.ticketList}>
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/${locale}/dashboard/support/${ticket.id}`}
                className={styles.ticketCard}
              >
                <div className={styles.ticketHeader}>
                  <div>
                    <h3>{ticket.subject}</h3>
                    <p className={styles.ticketNumber}>{ticket.ticketNumber}</p>
                  </div>
                  <div className={styles.ticketMeta}>
                    <span
                      className={styles.priority}
                      style={{
                        backgroundColor: priorityColors[ticket.priority],
                      }}
                    >
                      {ticket.priority}
                    </span>
                    <span className={styles.status}>{statusTexts[ticket.status]}</span>
                  </div>
                </div>
                <div className={styles.ticketFooter}>
                  <span className={styles.comments}>
                    {ticket.comments?.length || 0} hozzászólás
                  </span>
                  <span className={styles.date}>
                    {new Date(ticket.createdAt).toLocaleDateString(locale)}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {total > 10 && (
            <div className={styles.pagination}>
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Előző
              </button>
              <span>
                {page} / {Math.ceil(total / 10)}
              </span>
              <button
                disabled={page >= Math.ceil(total / 10)}
                onClick={() => setPage(page + 1)}
              >
                Következő
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
