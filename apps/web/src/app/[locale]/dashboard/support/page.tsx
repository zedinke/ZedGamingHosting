'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from '@i18n/translations';
import styles from './support.module.css';

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
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTickets();
  }, [page]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const res = await fetch(
        `/api/support/tickets?page=${page}&limit=10`,
        {
          headers: {
            'Accept-Language': locale,
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
      if (!res.ok) throw new Error('Failed to fetch tickets');
      const data = await res.json();
      setTickets(data.tickets);
      setTotal(data.pagination.total);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading tickets');
    } finally {
      setLoading(false);
    }
  };

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
