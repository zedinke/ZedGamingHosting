'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useLocale } from '@i18n/translations';
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
  assignedToId?: string | null;
  assignedTo?: { id: string; email: string; firstName: string; lastName: string } | null;
  assignedAt?: string | null;
  slaResponseDeadline?: string | null;
  slaResolveDeadline?: string | null;
  firstResponseAt?: string | null;
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
  assignedToId?: string;
  assignedTo?: { id: string; email: string; firstName: string; lastName: string };
}

interface Stats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  avgResponseTime: number;
}

interface SupportStaffMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  activeTickets: number;
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
  const [supportStaff, setSupportStaff] = useState<SupportStaffMember[]>([]);
  const [assigningTicketId, setAssigningTicketId] = useState<string | null>(null);
  const [overdueTickets, setOverdueTickets] = useState<SupportTicket[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch stats
      const statsRes = await fetch('/api/admin/support/stats', { headers });
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }

      // Fetch support staff workload
      const staffRes = await fetch('/api/admin/support/workload', { headers });
      if (staffRes.ok) {
        setSupportStaff(await staffRes.json());
      }

      // Fetch overdue SLA tickets
      const overdueRes = await fetch('/api/admin/support/overdue', { headers });
      if (overdueRes.ok) {
        setOverdueTickets(await overdueRes.json());
      }

      // Fetch tickets
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '10');
      if (filters.status) params.set('status', filters.status);
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.category) params.set('category', filters.category);

      const ticketsRes = await fetch(`/api/admin/support/tickets?${params}`, { headers });
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

  // Handle ticket assignments via WebSocket
  const handleTicketAssigned = useCallback((data: TicketEvent) => {
    setTickets((prevTickets) =>
      prevTickets.map((ticket) =>
        ticket.id === data.ticketId
          ? { 
              ...ticket, 
              assignedToId: data.assignedToId, 
              assignedTo: data.assignedTo,
              assignedAt: new Date().toISOString()
            }
          : ticket
      )
    );
    setLastUpdate(new Date().toLocaleTimeString());
    // Refresh staff workload
    fetch('/api/admin/support/workload').then(res => res.json()).then(setSupportStaff);
  }, []);

  // Assign ticket to specific staff member
  const assignTicket = async (ticketId: string, assignedToId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/admin/support/${ticketId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ assignedToId }),
      });

      if (!res.ok) throw new Error('Failed to assign ticket');

      const updatedTicket = await res.json();
      setTickets(prevTickets =>
        prevTickets.map(t => (t.id === ticketId ? updatedTicket : t))
      );
      setAssigningTicketId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to assign ticket');
    }
  };

  // Auto-assign ticket to least loaded staff
  const autoAssignTicket = async (ticketId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/admin/support/${ticketId}/auto-assign`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) throw new Error('Failed to auto-assign ticket');

      const updatedTicket = await res.json();
      if (updatedTicket) {
        setTickets(prevTickets =>
          prevTickets.map(t => (t.id === ticketId ? updatedTicket : t))
        );
      } else {
        alert('Nincs elérhető támogatási munkatárs');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to auto-assign ticket');
    }
  };

  // Calculate SLA status
  const getSlaStatus = (ticket: SupportTicket) => {
    const now = new Date();
    
    if (!ticket.firstResponseAt && ticket.slaResponseDeadline) {
      const deadline = new Date(ticket.slaResponseDeadline);
      const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursLeft < 0) return { color: '#ef4444', text: 'Lejárt válasz határidő' };
      if (hoursLeft < 1) return { color: '#f59e0b', text: `${Math.round(hoursLeft * 60)}p válaszra` };
      return { color: '#10b981', text: `${Math.round(hoursLeft)}ó válaszra` };
    }

    if (ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && ticket.slaResolveDeadline) {
      const deadline = new Date(ticket.slaResolveDeadline);
      const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursLeft < 0) return { color: '#ef4444', text: 'Lejárt megoldás határidő' };
      if (hoursLeft < 2) return { color: '#f59e0b', text: `${Math.round(hoursLeft * 60)}p megoldásra` };
      return { color: '#10b981', text: `${Math.round(hoursLeft)}ó megoldásra` };
    }

    return null;
  };

  // Subscribe to WebSocket events for admin role
  useEffect(() => {
    if (!socket) return;

    // Listen to support events
    const unsubNew = socket.subscribe('support:newTicket', handleNewTicket);
    const unsubComment = socket.subscribe('support:newComment', handleTicketComment);
    const unsubStatus = socket.subscribe('support:statusChanged', handleStatusChanged);
    const unsubAssigned = socket.subscribe('support:ticketAssigned', handleTicketAssigned);

    return () => {
      unsubNew();
      unsubComment();
      unsubStatus();
      unsubAssigned();
    };
  }, [socket, handleNewTicket, handleTicketComment, handleStatusChanged, handleTicketAssigned]);

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

      {overdueTickets.length > 0 && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
            <h3 style={{ margin: 0, color: '#ef4444' }}>SLA Határidő Túllépés ({overdueTickets.length})</h3>
          </div>
          <div style={{ fontSize: '0.875rem' }}>
            {overdueTickets.slice(0, 3).map(ticket => (
              <div key={ticket.id} style={{ padding: '0.25rem 0' }}>
                <Link href={`/${locale}/admin/support/${ticket.id}`} style={{ color: '#dc2626', textDecoration: 'underline' }}>
                  {ticket.ticketNumber}
                </Link>
                {' - '}
                <span style={{ color: '#991b1b' }}>{ticket.subject}</span>
              </div>
            ))}
            {overdueTickets.length > 3 && (
              <div style={{ marginTop: '0.5rem', fontStyle: 'italic', color: '#991b1b' }}>
                ...és még {overdueTickets.length - 3} jegy
              </div>
            )}
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
                  <th>Hozzárendelve</th>
                  <th>SLA</th>
                  <th>Hozzászólások</th>
                  <th>Dátum</th>
                  <th>Műveletek</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => {
                  const slaStatus = getSlaStatus(ticket);
                  return (
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
                      <td>
                        {ticket.assignedTo ? (
                          <div style={{ fontSize: '0.875rem' }}>
                            <div style={{ fontWeight: 500 }}>
                              {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}
                            </div>
                            <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                              {ticket.assignedTo.email}
                            </div>
                          </div>
                        ) : assigningTicketId === ticket.id ? (
                          <select
                            onChange={(e) => {
                              if (e.target.value === 'auto') {
                                autoAssignTicket(ticket.id);
                              } else if (e.target.value) {
                                assignTicket(ticket.id, e.target.value);
                              } else {
                                setAssigningTicketId(null);
                              }
                            }}
                            autoFocus
                            onBlur={() => setAssigningTicketId(null)}
                            style={{ fontSize: '0.875rem', padding: '0.25rem' }}
                          >
                            <option value="">Válassz...</option>
                            <option value="auto">🤖 Auto (legkevesebb jegy)</option>
                            {supportStaff.map(staff => (
                              <option key={staff.id} value={staff.id}>
                                {staff.firstName} {staff.lastName} ({staff.activeTickets} jegy)
                              </option>
                            ))}
                          </select>
                        ) : (
                          <button
                            onClick={() => setAssigningTicketId(ticket.id)}
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.25rem 0.5rem',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Hozzárendel
                          </button>
                        )}
                      </td>
                      <td>
                        {slaStatus && (
                          <span style={{
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.5rem',
                            backgroundColor: slaStatus.color + '20',
                            color: slaStatus.color,
                            borderRadius: '4px',
                            fontWeight: 500
                          }}>
                            {slaStatus.text}
                          </span>
                        )}
                      </td>
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
                  );
                })}
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
