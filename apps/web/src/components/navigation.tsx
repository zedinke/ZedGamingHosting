'use client';

import { Link, usePathname, useRouter } from '../i18n/routing';
import { useTranslations } from '@i18n/translations';
import { useAuthStore } from '../stores/auth-store';
import { Button } from '@zed-hosting/ui-kit';
import { ThemeToggle } from '../lib/theme';
import { cn } from '../lib/utils';
import { NotificationCenter } from './notification-center';
import { useNotificationContext } from '../context/notification-context';
import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import SearchModal from './SearchModal';
import { motion, useScroll, useTransform } from 'framer-motion';

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const t = useTranslations();
  const notifications = useNotificationContext();
  const [adminOpen, setAdminOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [navbarVisible, setNavbarVisible] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Scroll effects
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Check if scrolled past threshold
      setScrolled(currentScrollY > 10);
      
      // Hide navbar on scroll down, show on scroll up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setNavbarVisible(false);
      } else {
        setNavbarVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Keyboard shortcut for search (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Check admin role - handle both uppercase and lowercase, and different formats
  // Prisma schema uses: SUPERADMIN, RESELLER_ADMIN, USER, SUPPORT
  const userRole = user?.role?.toUpperCase();
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'SUPERADMIN' || userRole === 'RESELLER_ADMIN';

  const adminItems = [
    { href: `/admin`, label: 'Áttekintés' },
    { href: `/admin/plans`, label: 'Csomagok' },
    { href: `/admin/promotions`, label: 'Akciók' },
    { href: `/admin/media`, label: 'Média' },
    { href: `/admin/users`, label: 'Felhasználók' },
    { href: `/admin/nodes`, label: 'Node-ok' },
    { href: `/admin/servers`, label: 'Szerverek' },
    { href: `/admin/stats`, label: 'Statisztikák' },
    { href: `/admin/settings`, label: 'Beállítások' },
    { href: `/admin/licensing`, label: 'Licencelés' },
    { href: `/admin/logs`, label: 'Naplók' },
  ];

  // Public navigation items (available to all users)
  const publicNavItems = [
    { href: `/${locale}`, label: 'Otthon', icon: null },
    { href: `/${locale}/games`, label: 'Játékok', icon: null },
    { href: `/${locale}/pricing`, label: 'Árazás', icon: null },
    { href: `/${locale}/plans`, label: 'Csomagok', icon: null },
    { href: `/${locale}/knowledge-base`, label: 'Tudásbázis', icon: null },
  ];

  // Authenticated user items
  const userNavItems = user ? [
    { href: `/dashboard`, label: t('dashboard.title') },
    { href: `/dashboard/orders`, label: 'Rendelések' },
    { href: `/dashboard/support`, label: 'Támogatás' },
  ] : [];

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
    <motion.nav
      initial={{ y: 0 }}
      animate={{ 
        y: navbarVisible ? 0 : -100,
        backdropFilter: scrolled ? 'blur(20px)' : 'blur(8px)',
      }}
      transition={{ 
        duration: 0.3,
        ease: 'easeInOut'
      }}
      className="border-b sticky top-0 z-50 transition-all"
      style={{
        backgroundColor: scrolled 
          ? 'rgba(var(--color-bg-card-rgb), 0.8)' 
          : 'var(--color-bg-card)',
        borderColor: 'var(--color-border)',
        boxShadow: scrolled ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={`/dashboard`} className="flex items-center gap-3">
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
            {/* Public Navigation */}
            {!user && publicNavItems.map((item) => {
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

            {/* User Navigation (when logged in) */}
            {user && userNavItems.map((item) => {
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
                    pathname.startsWith(`/admin`)
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
            {/* Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-lg hover:bg-[var(--color-bg-elevated)] transition-colors group relative"
              title="Keresés (⌘K)"
            >
              <Search className="w-5 h-5 text-[var(--color-text-muted)] group-hover:text-[var(--color-text-main)]" />
              <span className="absolute -bottom-8 right-0 bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                ⌘K
              </span>
            </button>

            <NotificationCenter
              notifications={notifications.notifications}
              onMarkAsRead={notifications.markAsRead}
              onMarkAllAsRead={notifications.markAllAsRead}
              onDismiss={notifications.dismissNotification}
              onDismissAll={notifications.dismissAll}
            />
            <ThemeToggle />
            <div className="text-right cursor-pointer" onClick={() => router.push(`/profile`)}>
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
                window.location.href = `/login`;
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </motion.nav>
  );
}

