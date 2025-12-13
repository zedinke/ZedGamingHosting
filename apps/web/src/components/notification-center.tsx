'use client';

import { useState, useEffect } from 'react';
import { Card, Button } from '@zed-hosting/ui-kit';
import { Bell, X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
}

export function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  onDismissAll,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getBgColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-500/20 border-green-500/50';
      case 'error':
        return 'bg-red-500/20 border-red-500/50';
      case 'warning':
        return 'bg-yellow-500/20 border-yellow-500/50';
      case 'info':
        return 'bg-blue-500/20 border-blue-500/50';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-opacity-20 transition-colors"
        style={{ backgroundColor: 'var(--color-bg-card)' }}
      >
        <Bell className="h-5 w-5" style={{ color: 'var(--color-text-main)' }} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 rounded-full text-xs flex items-center justify-center"
            style={{ backgroundColor: '#ef4444', color: '#fff' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <Card className="absolute right-0 mt-2 w-96 max-h-96 overflow-y-auto z-50 glass elevation-3 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: '#f8fafc' }}>
                Értesítések
                {unreadCount > 0 && (
                  <span className="ml-2 text-sm" style={{ color: '#cbd5e1' }}>
                    ({unreadCount} olvasatlan)
                  </span>
                )}
              </h3>
              <div className="flex gap-2">
                {notifications.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onMarkAllAsRead}
                    >
                      Mind olvasott
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onDismissAll}
                    >
                      Mind törlés
                    </Button>
                  </>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="hover:opacity-70 transition-opacity"
                  style={{ color: '#cbd5e1' }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" style={{ color: '#cbd5e1' }} />
                <p style={{ color: '#cbd5e1' }}>Nincs értesítés</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      notification.read ? 'opacity-60' : ''
                    } ${getBgColor(notification.type)}`}
                    onClick={() => !notification.read && onMarkAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      {getIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold" style={{ color: '#f8fafc' }}>
                              {notification.title}
                            </h4>
                            <p className="text-sm mt-1" style={{ color: '#cbd5e1' }}>
                              {notification.message}
                            </p>
                            <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
                              {notification.timestamp.toLocaleString('hu-HU')}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDismiss(notification.id);
                            }}
                            className="hover:opacity-70 transition-opacity"
                            style={{ color: '#cbd5e1' }}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

