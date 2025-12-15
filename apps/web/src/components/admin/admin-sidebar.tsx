'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../../lib/utils';
import {
  LayoutDashboard,
  Users,
  Server,
  Network,
  BarChart3,
  Settings,
  Key,
  FileText,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const locale = pathname.split('/')[1] || 'hu';

  const navItems: NavItem[] = [
    {
      href: `/${locale}/admin`,
      label: 'Áttekintés',
      icon: LayoutDashboard,
    },
    {
      href: `/${locale}/admin/users`,
      label: 'Felhasználók',
      icon: Users,
    },
    {
      href: `/${locale}/admin/nodes`,
      label: 'Node-ok',
      icon: Network,
    },
    {
      href: `/${locale}/admin/servers`,
      label: 'Szerverek',
      icon: Server,
    },
    {
      href: `/${locale}/admin/stats`,
      label: 'Statisztikák',
      icon: BarChart3,
    },
    {
      href: `/${locale}/admin/settings`,
      label: 'Beállítások',
      icon: Settings,
    },
    {
      href: `/${locale}/admin/licensing`,
      label: 'Licencelés',
      icon: Key,
    },
    {
      href: `/${locale}/admin/logs`,
      label: 'Naplók',
      icon: FileText,
    },
  ];

  const isActive = (href: string) => {
    if (href === `/${locale}/admin`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg border"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-main)',
        }}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-64 border-r transition-transform duration-300 z-40',
          'bg-[var(--color-bg-card)] border-[var(--color-border)]',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-[var(--color-border)]">
            <Link href={`/${locale}/admin`} className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                }}
              >
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg" style={{ color: 'var(--color-text-main)' }}>
                Admin Panel
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                    'text-sm font-medium',
                    active
                      ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-main)]'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}

