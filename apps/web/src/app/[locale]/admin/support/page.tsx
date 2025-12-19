'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useSocketContext } from '../../../../contexts/socket-context';
import styles from './support.module.css';

interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED';
  user: { email: string };
  createdAt: string;
  comments: TicketComment[];
}

interface TicketComment {
  id: string;
  message: string;
  authorId: string;
  createdAt: string;
}

interface TicketEvent {
  ticket: SupportTicket;
  ticketId: string;
  comment: TicketComment;
  newStatus: string;
}

interface Stats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  avgResponseTime: number;
}

const statusTexts = {
  OPEN: 'Nyitott',
  IN_PROGRESS: 'Feldolgozás alatt',
  WAITING_CUSTOMER: 'Várakozás',
  RESOLVED: 'Megoldva',
  CLOSED: 'Lezárva',
};

const priorityColors = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  HIGH: '#ef4444',
  CRITICAL: '#7c3aed',
};

export default function AdminSupportPage() {
  const locale = useLocale();
  const socket = useSocketContext();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
  });
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch stats
      const statsRes = await fetch('/api/admin/support/stats');
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }

      // Fetch tickets
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '10');
      if (filters.status) params.set('status', filters.status);
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.category) params.set('category', filters.category);

      const ticketsRes = await fetch(`/api/admin/support/tickets?${params}`);
      if (!ticketsRes.ok) throw new Error('Failed to fetch tickets');

      const data = await ticketsRes.json();
      setTickets(data.tickets);
      setTotal(data.pagination.total);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading data');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle new tickets via WebSocket
  const handleNewTicket = useCallback((data: TicketEvent) => {
    setTickets((prevTickets) => {
      const updated = [data.ticket, ...prevTickets];
      return updated.slice(0, 10); // Keep first 10
    });
    setLastUpdate(new Date().toLocaleTimeString());
    if (stats) {
      setStats({ ...stats, total: stats.total + 1 });
    }
  }, [stats]);

  // Handle comment updates via WebSocket
  const handleTicketComment = useCallback((data: TicketEvent) => {
    setTickets((prevTickets) =>
      prevTickets.map((ticket) =>
        ticket.id === data.ticketId
          ? { ...ticket, comments: [...(ticket.comments || []), data.comment] }
          : ticket
      )
    );
    setLastUpdate(new Date().toLocaleTimeString());
  }, []);

  // Handle status changes via WebSocket
  const handleStatusChanged = useCallback((data: TicketEvent) => {
    setTickets((prevTickets) =>
      prevTickets.map((ticket) =>
        ticket.id === data.ticketId
          ? { ...ticket, status: data.newStatus as 'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED' }
          : ticket
      )
    );
    setLastUpdate(new Date().toLocaleTimeString());
  }, []);

  // Subscribe to WebSocket events for admin role
  useEffect(() => {
    if (!socket) return;

    // Listen to support events
    const unsubNew = socket.subscribe('support:newTicket', handleNewTicket);
    const unsubComment = socket.subscribe('support:newComment', handleTicketComment);
    const unsubStatus = socket.subscribe('support:statusChanged', handleStatusChanged);

    return () => {
      unsubNew();
      unsubComment();
      unsubStatus();
    };
  }, [socket, handleNewTicket, handleTicketComment, handleStatusChanged]);

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Támogatási Jegyek Kezelés</h1>
        {lastUpdate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#10b981' }}>
            <div style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
            <span>Élő frissítések: {lastUpdate}</span>
          </div>
        )}
      </div>

      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>Összes Jegy</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue} style={{ color: '#ef4444' }}>
              {stats.open}
            </div>
            <div className={styles.statLabel}>Nyitott</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue} style={{ color: '#f59e0b' }}>
              {stats.inProgress}
            </div>
            <div className={styles.statLabel}>Feldolgozás alatt</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue} style={{ color: '#10b981' }}>
              {stats.resolved}
            </div>
            <div className={styles.statLabel}>Megoldva</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {Math.round(stats.avgResponseTime)}m
            </div>
            <div className={styles.statLabel}>Átl. Válaszidő</div>
          </div>
        </div>
      )}

      <div className={styles.filters}>
        <select
          value={filters.status}
          onChange={(e) =>
            setFilters({ ...filters, status: e.target.value })
          }
        >
          <option value="">Összes Státusz</option>
          <option value="OPEN">Nyitott</option>
          <option value="IN_PROGRESS">Feldolgozás alatt</option>
          <option value="RESOLVED">Megoldva</option>
          <option value="CLOSED">Lezárva</option>
        </select>

        <select
          value={filters.priority}
          onChange={(e) =>
            setFilters({ ...filters, priority: e.target.value })
          }
        >
          <option value="">Összes Prioritás</option>
          <option value="LOW">Alacsony</option>
          <option value="MEDIUM">Közepes</option>
          <option value="HIGH">Magas</option>
          <option value="CRITICAL">Kritikus</option>
        </select>

        <select
          value={filters.category}
          onChange={(e) =>
            setFilters({ ...filters, category: e.target.value })
          }
        >
          <option value="">Összes Kategória</option>
          <option value="billing">Számlázás</option>
          <option value="technical">Technikai</option>
          <option value="general">Általános</option>
        </select>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Betöltés...</div>
      ) : tickets.length === 0 ? (
        <div className={styles.empty}>Nincs találat</div>
      ) : (
        <>
          <div className={styles.table}>
            <table>
              <thead>
                <tr>
                  <th>Jegy</th>
                  <th>Ügyfél</th>
                  <th>Prioritás</th>
                  <th>Státusz</th>
                  <th>Hozzászólások</th>
                  <th>Dátum</th>
                  <th>Műveletek</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      <Link href={`/${locale}/admin/support/${ticket.id}`}>
                        {ticket.ticketNumber}
                      </Link>
                    </td>
                    <td>{ticket.user.email}</td>
                    <td>
                      <span
                        className={styles.priority}
                        style={{
                          backgroundColor: priorityColors[ticket.priority],
                        }}
                      >
                        {ticket.priority}
                      </span>
                    </td>
                    <td>{statusTexts[ticket.status]}</td>
                    <td>{ticket.comments?.length || 0}</td>
                    <td>
                      {new Date(ticket.createdAt).toLocaleDateString(locale)}
                    </td>
                    <td>
                      <Link
                        href={`/${locale}/admin/support/${ticket.id}`}
                        className={styles.editLink}
                      >
                        Szerkesztés
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
