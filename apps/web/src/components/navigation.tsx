'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '../stores/auth-store';
import { Button } from '@zed-hosting/ui-kit';
import { ThemeToggle } from '../lib/theme';
import { cn } from '../lib/utils';
import { NotificationCenter } from './notification-center';
import { useNotificationContext } from '../context/notification-context';
import { useEffect, useRef, useState } from 'react';

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const t = useTranslations();
  const notifications = useNotificationContext();
  const [adminOpen, setAdminOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const locale = pathname.split('/')[1] || 'hu';

  // Check admin role - handle both uppercase and lowercase, and different formats
  // Prisma schema uses: SUPERADMIN, RESELLER_ADMIN, USER, SUPPORT
  const userRole = user?.role?.toUpperCase();
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'SUPERADMIN' || userRole === 'RESELLER_ADMIN';

  const adminItems = [
    { href: `/${locale}/admin`, label: 'Áttekintés' },
    { href: `/${locale}/admin/plans`, label: 'Csomagok' },
    { href: `/${locale}/admin/users`, label: 'Felhasználók' },
    { href: `/${locale}/admin/nodes`, label: 'Node-ok' },
    { href: `/${locale}/admin/servers`, label: 'Szerverek' },
    { href: `/${locale}/admin/stats`, label: 'Statisztikák' },
    { href: `/${locale}/admin/settings`, label: 'Beállítások' },
    { href: `/${locale}/admin/licensing`, label: 'Licencelés' },
    { href: `/${locale}/admin/logs`, label: 'Naplók' },
  ];

  const navItems = [
    { href: `/${locale}/dashboard`, label: t('dashboard.title') },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAdminOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav
      className="border-b backdrop-blur-sm sticky top-0 z-50"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={`/${locale}/dashboard`} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-lg font-bold" style={{ color: 'var(--color-text-main)' }}>
              ZedGamingHosting
            </span>
          </Link>

          {/* Nav Items */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-elevated)]'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}

            {isAdmin && (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setAdminOpen((prev) => !prev)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                    pathname.startsWith(`/${locale}/admin`)
                      ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-elevated)]'
                  )}
                >
                  ⚙️ Admin
                  <span className="text-xs" aria-hidden>
                    {adminOpen ? '▲' : '▼'}
                  </span>
                </button>
                {adminOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg border"
                    style={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
                  >
                    <ul className="py-2 text-sm">
                      {adminItems.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={cn(
                              'block px-4 py-2 hover:bg-[var(--color-bg-elevated)] transition-colors',
                              pathname === item.href ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'
                            )}
                            onClick={() => setAdminOpen(false)}
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <NotificationCenter
              notifications={notifications.notifications}
              onMarkAsRead={notifications.markAsRead}
              onMarkAllAsRead={notifications.markAllAsRead}
              onDismiss={notifications.dismissNotification}
              onDismissAll={notifications.dismissAll}
            />
            <ThemeToggle />
            <div className="text-right cursor-pointer" onClick={() => router.push(`/${locale}/profile`)}>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-main)' }}>
                {user?.email}
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {user?.role}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                logout();
                window.location.href = `/${locale}/login`;
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

