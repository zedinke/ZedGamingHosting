'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWebSocket } from '../../../../../contexts/WebSocketContext';
import { useTicketSocket, useSocketEvent, useSocketEmit } from '../../../../../hooks/useSocket';
import { getAccessToken, getRefreshToken } from '@/lib/get-access-token';
import { useAuthStore } from '@/stores/auth-store';
import styles from './detail.module.css';

interface TicketComment {
  id: string;
  message: string;
  author: {
    id: string;
    email: string;
  };
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
  createdAt: string;
  updatedAt: string;
  comments: TicketComment[];
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

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { socket, isConnected } = useWebSocket();
  const ticketId = params.id as string;
  const locale = params.locale;

  const { typingUsers, sendTyping } = useTicketSocket(socket, ticketId);
  const emit = useSocketEmit(socket);

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [commenting, setCommenting] = useState(false);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout>();
  const notificationTimeoutRef = React.useRef<NodeJS.Timeout>();

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const token = getAccessToken();
      const res = await fetch(`/api/support/tickets/${ticketId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Jegy nem található');
      const data = await res.json();
      setTicket(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba a jegy betöltésekor');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Listen for new comments (server emits 'support:newComment' to ticket room)
   */
  useSocketEvent(socket, 'support:newComment', (newComment: any) => {
    setTicket((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        comments: [newComment, ...prev.comments],
      };
    });
    // Show incoming comment notification
    const authorName = newComment.author?.email?.split('@')[0] || 'Valaki';
    setNotification({ message: `Új hozzászólás: ${authorName}`, type: 'info' });
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null);
    }, 3000);
  });

  /**
   * Listen for status changes (server emits 'support:statusChanged')
   */
  useSocketEvent(socket, 'support:statusChanged', (data: any) => {
    setTicket((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        status: data.status,
        updatedAt: new Date().toISOString(),
      };
    });
  });

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!comment.trim()) return;

    setCommenting(true);
    setIsTyping(false);

    try {
      const token = getAccessToken();
      let res = await fetch(`/api/support/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ message: comment }),
      });

      // If unauthorized, try to refresh token once
      if (res.status === 401) {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          const refreshRes = await fetch(`/api/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            const newAccessToken = refreshData?.accessToken as string | undefined;
            if (newAccessToken) {
              // Update Zustand tokens
              useAuthStore.getState().updateTokens(newAccessToken, refreshToken);
              res = await fetch(`/api/support/tickets/${ticketId}/comments`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${newAccessToken}`,
                },
                body: JSON.stringify({ message: comment }),
              });
            }
          }
        }
      }

      if (!res.ok) throw new Error('Hozzászólás küldése sikertelen');

      // Optimistically append returned comment
      const createdComment = await res.json().catch(() => null);
      if (createdComment) {
        setTicket((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            comments: [
              {
                id: createdComment.id,
                message: createdComment.message,
                author: createdComment.author || { id: createdComment.authorId, email: createdComment.authorName },
                createdAt: createdComment.createdAt || new Date().toISOString(),
              },
              ...prev.comments,
            ],
          };
        });
      }

      setComment('');
      // Show success notification
      setNotification({ message: 'Hozzászólás sikeresen elküldve', type: 'success' });
      if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
      notificationTimeoutRef.current = setTimeout(() => {
        setNotification(null);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hozzászólás küldése sikertelen');
    } finally {
      setCommenting(false);
    }
  };

  /**
   * Handle comment input change with typing indicator
   */
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);

    // Send typing indicator
    if (isConnected) {
      sendTyping();
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
      {notification && (
        <div className={`${styles.notification} ${styles[notification.type]}`}>
          {notification.message}
        </div>
      )}

      <button onClick={() => router.back()} className={styles.backButton}>
        ← Vissza
      </button>

      <div className={styles.ticketHeader}>
        <div>
          <h1>{ticket.subject}</h1>
          <p className={styles.ticketNumber}>{ticket.ticketNumber}</p>
        </div>
        <div className={styles.meta}>
          <span
            className={styles.priority}
            style={{ backgroundColor: priorityColors[ticket.priority] }}
          >
            {ticket.priority}
          </span>
          <span className={styles.status}>{statusTexts[ticket.status]}</span>
        </div>
      </div>

      <div className={styles.ticketInfo}>
        <div className={styles.infoGrid}>
          <div>
            <strong>Kategória:</strong>
            <span>{ticket.category || '-'}</span>
          </div>
          <div>
            <strong>Létrehozva:</strong>
            <span>
              {new Date(ticket.createdAt).toLocaleDateString(locale as string)}
            </span>
          </div>
          <div>
            <strong>Frissítve:</strong>
            <span>
              {new Date(ticket.updatedAt).toLocaleDateString(locale as string)}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.description}>
        <h2>Leírás</h2>
        <p>{ticket.description}</p>
      </div>

      <div className={styles.comments}>
        <h2>
          Hozzászólások ({ticket.comments?.length || 0})
          {typingUsers.size > 0 && (
            <span style={{ fontSize: '0.8em', marginLeft: '1em', color: '#999' }}>
              {Array.from(typingUsers).join(', ')} gépel...
            </span>
          )}
        </h2>

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
                <p className={styles.commentMessage}>{c.message}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.noComments}>Nincs hozzászólás még</p>
        )}

        {ticket.status !== 'CLOSED' && (
          <form onSubmit={handleAddComment} className={styles.commentForm}>
            <textarea
              value={comment}
              onChange={handleCommentChange}
              placeholder="Írj egy hozzászólást..."
              rows={4}
              disabled={commenting}
            />
            <button
              type="submit"
              disabled={commenting || !comment.trim()}
              className={styles.submitButton}
            >
              {commenting ? 'Küldés...' : 'Hozzászólás Küldése'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
