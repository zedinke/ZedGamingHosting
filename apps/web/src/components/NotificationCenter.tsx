'use client';

import { useWebSocket } from '../../../../../contexts/WebSocketContext';
import { useNotifications, useSocketEvent } from '../../../../../hooks/useSocket';
import { useEffect, useState } from 'react';

interface Notification {
  id: number;
  type: string;
  message: string;
  data: any;
}

/**
 * NotificationCenter Component - Shows real-time notifications
 */
export function NotificationCenter() {
  const { socket } = useWebSocket();
  const { notifications, removeNotification } = useNotifications(socket);
  const [displayedNotifications, setDisplayedNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Convert notifications to display format and auto-remove after 5s
    const newNotifications = notifications
      .filter((n) => !displayedNotifications.find((d) => d.id === n.id))
      .map((n, idx) => ({
        ...n,
        displayId: Date.now() + idx,
      }));

    setDisplayedNotifications((prev) => [...newNotifications, ...prev].slice(0, 5));
  }, [notifications]);

  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 1000, maxWidth: 400 }}>
      {displayedNotifications.map((notif) => (
        <div
          key={notif.id}
          style={{
            marginBottom: 10,
            padding: 12,
            backgroundColor: getNotificationBgColor(notif.type),
            color: 'white',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            animation: 'slideIn 0.3s ease-in',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{getNotificationMessage(notif)}</span>
            <button
              onClick={() => removeNotification(notif.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: 18,
              }}
            >
              ×
            </button>
          </div>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

function getNotificationBgColor(type: string): string {
  switch (type) {
    case 'support:newTicket':
      return '#3b82f6'; // blue
    case 'support:ticketAssigned':
      return '#8b5cf6'; // purple
    case 'error':
      return '#ef4444'; // red
    default:
      return '#6b7280'; // gray
  }
}

function getNotificationMessage(notif: any): string {
  switch (notif.type) {
    case 'support:newTicket':
      return `Új jegy: ${notif.data?.subject || 'Új támogatási kérés'}`;
    case 'support:ticketAssigned':
      return `Jegy hozzárendelve: ${notif.data?.ticketNumber || 'Új feladat'}`;
    default:
      return notif.message || 'Értesítés';
  }
}
