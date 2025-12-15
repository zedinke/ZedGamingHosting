'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { css } from '../../styled-system/css';
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
        className={css({
          display: { base: 'block', lg: 'none' },
          position: 'fixed',
          top: '1rem',
          left: '1rem',
          zIndex: 50,
          padding: '0.5rem',
          borderRadius: '0.5rem',
          borderWidth: '1px',
          backgroundColor: 'var(--color-bg-card)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-main)',
          cursor: 'pointer',
        })}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X className={css({ height: '1.25rem', width: '1.25rem' })} /> : <Menu className={css({ height: '1.25rem', width: '1.25rem' })} />}
      </button>

      {/* Sidebar */}
      <aside
        className={css({
          position: 'fixed',
          left: 0,
          top: 0,
          height: '100%',
          width: '16rem',
          borderRightWidth: '1px',
          transition: 'transform 300ms',
          zIndex: 40,
          backgroundColor: 'var(--color-bg-card)',
          borderColor: 'var(--color-border)',
          transform: {
            base: isMobileOpen ? 'translateX(0)' : '-translateX(100%)',
            lg: 'translateX(0)',
          },
        })}
      >
        <div className={css({ display: 'flex', flexDirection: 'column', height: '100%' })}>
          {/* Logo */}
          <div className={css({ height: '4rem', display: 'flex', alignItems: 'center', paddingX: '1.5rem', borderBottomWidth: '1px', borderColor: 'var(--color-border)' })}>
            <Link href={`/${locale}/admin`} className={css({ display: 'flex', alignItems: 'center', gap: '0.5rem' })}>
              <div
                className={css({
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                })}
              >
                <LayoutDashboard className={css({ width: '1.25rem', height: '1.25rem', color: 'white' })} />
              </div>
              <span className={css({ fontWeight: 'bold', fontSize: 'lg', color: 'var(--color-text-main)' })}>
                Admin Panel
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className={css({ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' })}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={css({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    paddingX: '1rem',
                    paddingY: '0.75rem',
                    borderRadius: '0.5rem',
                    transition: 'all 200ms',
                    fontSize: 'sm',
                    fontWeight: 'medium',
                    ...(active
                      ? {
                          backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
                          color: 'var(--color-primary)',
                        }
                      : {
                          color: 'var(--color-text-secondary)',
                          _hover: {
                            backgroundColor: 'var(--color-bg-hover)',
                            color: 'var(--color-text-main)',
                          },
                        }),
                  })}
                >
                  <Icon className={css({ height: '1.25rem', width: '1.25rem' })} />
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
          className={css({
            display: { base: 'block', lg: 'none' },
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 30,
          })}
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}
