'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useAuthStore } from '../../../stores/auth-store';
import { AdminLayout } from '../../../components/admin/admin-layout';
import { Card } from '@zed-hosting/ui-kit';
import {
  Users,
  Network,
  Server,
  Settings,
  FileText,
  Key,
  BarChart3,
} from 'lucide-react';
import { css } from '../../../styled-system/css';

export default function AdminPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated } = useAuthStore();
  const locale = (params.locale as string) || 'hu';
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }

    const userRole = user?.role?.toUpperCase();
    if (isHydrated && isAuthenticated && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'SUPERADMIN' && userRole !== 'RESELLER_ADMIN') {
      router.push(`/${locale}/dashboard`);
      return;
    }
  }, [isAuthenticated, isHydrated, user, router, locale]);

  if (!isHydrated) {
    return (
      <div className={css({ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg-surface)' })}>
        <p className={css({ color: 'var(--color-text-muted)' })}>Betöltés...</p>
      </div>
    );
  }

  const userRole = user?.role?.toUpperCase();
  if (!isAuthenticated || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'SUPERADMIN' && userRole !== 'RESELLER_ADMIN')) {
    return (
      <div className={css({ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg-surface)' })}>
        <p className={css({ color: 'var(--color-text-muted)' })}>Átirányítás...</p>
      </div>
    );
  }

  const menuItems = [
    {
      title: 'Felhasználók',
      description: 'Felhasználók kezelése és jogosultságok beállítása',
      href: `/${locale}/admin/users`,
      icon: Users,
      iconColor: '#2563eb',
      bgColor: '#eff6ff',
    },
    {
      title: 'Node-ok',
      description: 'Szerver node-ok kezelése és monitorozása',
      href: `/${locale}/admin/nodes`,
      icon: Network,
      iconColor: '#16a34a',
      bgColor: '#f0fdf4',
    },
    {
      title: 'Szerverek',
      description: 'Összes szerver áttekintése és kezelése',
      href: `/${locale}/admin/servers`,
      icon: Server,
      iconColor: '#9333ea',
      bgColor: '#faf5ff',
    },
    {
      title: 'Statisztikák',
      description: 'Platform statisztikák és jelentések',
      href: `/${locale}/admin/stats`,
      icon: BarChart3,
      iconColor: '#ea580c',
      bgColor: '#fff7ed',
    },
    {
      title: 'Beállítások',
      description: 'Platform konfiguráció és beállítások',
      href: `/${locale}/admin/settings`,
      icon: Settings,
      iconColor: '#475569',
      bgColor: '#f8fafc',
    },
    {
      title: 'Licencelés',
      description: 'Licenc kezelés és validáció',
      href: `/${locale}/admin/licensing`,
      icon: Key,
      iconColor: '#4f46e5',
      bgColor: '#eef2ff',
    },
    {
      title: 'Naplók',
      description: 'Rendszernaplók és audit trail',
      href: `/${locale}/admin/logs`,
      icon: FileText,
      iconColor: '#dc2626',
      bgColor: '#fef2f2',
    },
  ];

  return (
    <div>
      <AdminLayout title="Admin Panel">
        <div>
          <header className={css({ marginBottom: '2rem' })}>
            <h1 className={css({ fontSize: '3xl', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--color-text-main)' })}>
              Admin Panel
            </h1>
            <p className={css({ color: 'var(--color-text-muted)' })}>
              Rendszerfelügyelet és konfiguráció
            </p>
          </header>

          <div className={css({ display: 'grid', gridTemplateColumns: { base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: '1.5rem' })}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.href}
                  hoverable
                  className={css({ padding: '1.5rem', cursor: 'pointer', transition: 'all 200ms' })}
                  onClick={() => router.push(item.href)}
                >
                  <div className={css({ display: 'flex', alignItems: 'flex-start', gap: '1rem' })}>
                    <div className={css({ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: item.bgColor })}>
                      <Icon className={css({ height: '1.5rem', width: '1.5rem', color: item.iconColor })} />
                    </div>
                    <div className={css({ flex: 1 })}>
                      <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', marginBottom: '0.25rem', color: 'var(--color-text-main)' })}>
                        {item.title}
                      </h3>
                      <p className={css({ fontSize: 'sm', color: 'var(--color-text-muted)' })}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </AdminLayout>
    </div>
  );
}
