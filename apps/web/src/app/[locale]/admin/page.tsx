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
  Percent,
} from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center bg-background-surface">
        <p className="text-text-muted">Betöltés...</p>
      </div>
    );
  }

  const userRole = user?.role?.toUpperCase();
  if (!isAuthenticated || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'SUPERADMIN' && userRole !== 'RESELLER_ADMIN')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-surface">
        <p className="text-text-muted">Átirányítás...</p>
      </div>
    );
  }

  const menuItems = [
    {
      title: 'Csomagok',
      description: 'Szolgáltatási csomagok kezelése (CRUD)',
      href: `/${locale}/admin/plans`,
      icon: Settings,
      iconColor: '#0ea5e9',
      bgColor: '#ecfeff',
    },
    {
      title: 'Akciók',
      description: 'Kedvezmények mindenre, játékokra vagy csomagokra',
      href: `/${locale}/admin/promotions`,
      icon: Percent,
      iconColor: '#f97316',
      bgColor: '#fff7ed',
    },
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
          <header className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-text-primary">
              Admin Panel
            </h1>
            <p className="text-text-muted">
              Rendszerfelügyelet és konfiguráció
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.href}
                  hoverable
                  className="p-6 cursor-pointer hover:shadow-lg transition-all duration-200"
                  onClick={() => router.push(item.href)}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: item.bgColor }}>
                      <Icon className="h-6 w-6" style={{ color: item.iconColor }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1 text-text-primary">
                        {item.title}
                      </h3>
                      <p className="text-sm text-text-muted">
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
