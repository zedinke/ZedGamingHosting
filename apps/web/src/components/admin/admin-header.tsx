'use client';

import { useAuthStore } from '../../stores/auth-store';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@zed-hosting/ui-kit';
import { NotificationCenter } from '../notification-center';
import { useNotificationContext } from '../../context/notification-context';
import { ThemeToggle } from '../../lib/theme';
import { LogOut, User } from 'lucide-react';

interface AdminHeaderProps {
  title?: string;
  actions?: React.ReactNode;
}

export function AdminHeader({ title, actions }: AdminHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const notifications = useNotificationContext();
  const locale = pathname.split('/')[1] || 'hu';

  const handleLogout = () => {
    logout();
    window.location.href = `/${locale}/login`;
  };

  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background-card">
      <div className="flex items-center gap-4">
        {title && (
          <h1 className="text-xl font-semibold text-text-primary">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-3">
        {actions && <div className="flex items-center gap-2">{actions}</div>}

        <NotificationCenter
          notifications={notifications.notifications}
          onMarkAsRead={notifications.markAsRead}
          onMarkAllAsRead={notifications.markAllAsRead}
          onDismiss={notifications.dismissNotification}
          onDismissAll={notifications.dismissAll}
        />

        <ThemeToggle />

        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-background-surface transition-colors"
          onClick={() => router.push(`/${locale}/profile`)}
        >
          <User className="h-4 w-4 text-text-muted" />
          <div className="text-right">
            <p className="text-sm font-medium text-text-primary">
              {user?.email}
            </p>
            <p className="text-xs text-text-muted">
              {user?.role}
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2 inline" />
          Kijelentkezés
        </Button>
      </div>
    </header>
  );
}
