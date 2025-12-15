'use client';

import { useAuthStore } from '../../stores/auth-store';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@zed-hosting/ui-kit';
import { NotificationCenter } from '../notification-center';
import { useNotificationContext } from '../../context/notification-context';
import { ThemeToggle } from '../../lib/theme';
import { LogOut, User } from 'lucide-react';
import { css } from '../../styled-system/css';

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
    <header
      className={css({
        height: '4rem',
        borderBottomWidth: '1px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingX: '1.5rem',
        backgroundColor: 'var(--color-bg-card)',
        borderColor: 'var(--color-border)',
      })}
    >
      <div className={css({ display: 'flex', alignItems: 'center', gap: '1rem' })}>
        {title && (
          <h1 className={css({ fontSize: 'xl', fontWeight: 'semibold', color: 'var(--color-text-main)' })}>
            {title}
          </h1>
        )}
      </div>

      <div className={css({ display: 'flex', alignItems: 'center', gap: '0.75rem' })}>
        {actions && <div className={css({ display: 'flex', alignItems: 'center', gap: '0.5rem' })}>{actions}</div>}

        <NotificationCenter
          notifications={notifications.notifications}
          onMarkAsRead={notifications.markAsRead}
          onMarkAllAsRead={notifications.markAllAsRead}
          onDismiss={notifications.dismissNotification}
          onDismissAll={notifications.dismissAll}
        />

        <ThemeToggle />

        <div
          className={css({
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            paddingX: '0.75rem',
            paddingY: '0.5rem',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            _hover: {
              backgroundColor: 'var(--color-bg-hover)',
            },
            transition: 'colors 200ms',
          })}
          onClick={() => router.push(`/${locale}/profile`)}
        >
          <User className={css({ height: '1rem', width: '1rem', color: 'var(--color-text-muted)' })} />
          <div className={css({ textAlign: 'right' })}>
            <p className={css({ fontSize: 'sm', fontWeight: 'medium', color: 'var(--color-text-main)' })}>
              {user?.email}
            </p>
            <p className={css({ fontSize: 'xs', color: 'var(--color-text-muted)' })}>
              {user?.role}
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className={css({ height: '1rem', width: '1rem', marginRight: '0.5rem', display: 'inline' })} />
          Kijelentkezés
        </Button>
      </div>
    </header>
  );
}
