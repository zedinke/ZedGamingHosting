'use client';

import { useRouter, usePathname } from 'next/navigation';
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
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Extract locale from pathname, defaulting to 'hu'
  const parts = pathname.split('/').filter(Boolean);
  let locale = 'hu';
  if (parts.length > 0 && parts[0] !== 'admin') {
    locale = parts[0];
  }

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
        className="block lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg border border-border bg-background-card text-text-primary cursor-pointer hover:bg-background-surface transition-colors"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 border-r border-border transition-transform duration-300 z-40 bg-background-card ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-border cursor-pointer hover:bg-background-surface transition-colors"
            onClick={() => {
              setIsMobileOpen(false);
              router.push(`/${locale}/admin`);
            }}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-600">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-text-primary">
                Admin Panel
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <button
                  key={item.href}
                  onClick={() => {
                    setIsMobileOpen(false);
                    router.push(item.href);
                  }}
                  className={`w-full text-left flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                    active
                      ? 'bg-primary-500/10 text-primary-500'
                      : 'text-text-muted hover:bg-background-surface hover:text-text-primary'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="block lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}
