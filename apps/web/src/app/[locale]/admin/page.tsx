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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-surface)' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Betöltés...</p>
      </div>
    );
  }

  const userRole = user?.role?.toUpperCase();
  if (!isAuthenticated || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'SUPERADMIN' && userRole !== 'RESELLER_ADMIN')) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-surface)' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Átirányítás...</p>
      </div>
    );
  }

  const menuItems = [
    {
      title: 'Felhasználók',
      description: 'Felhasználók kezelése és jogosultságok beállítása',
      href: `/${locale}/admin/users`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Node-ok',
      description: 'Szerver node-ok kezelése és monitorozása',
      href: `/${locale}/admin/nodes`,
      icon: Network,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Szerverek',
      description: 'Összes szerver áttekintése és kezelése',
      href: `/${locale}/admin/servers`,
      icon: Server,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Statisztikák',
      description: 'Platform statisztikák és jelentések',
      href: `/${locale}/admin/stats`,
      icon: BarChart3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Beállítások',
      description: 'Platform konfiguráció és beállítások',
      href: `/${locale}/admin/settings`,
      icon: Settings,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
    {
      title: 'Licencelés',
      description: 'Licenc kezelés és validáció',
      href: `/${locale}/admin/licensing`,
      icon: Key,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Naplók',
      description: 'Rendszernaplók és audit trail',
      href: `/${locale}/admin/logs`,
      icon: FileText,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div className="light">
      <AdminLayout title="Admin Panel">
        <div>
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-main)' }}>
              Admin Panel
            </h1>
            <p style={{ color: 'var(--color-text-muted)' }}>
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
                  className="p-6 cursor-pointer transition-all"
                  onClick={() => router.push(item.href)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`${item.bgColor} p-3 rounded-lg`}>
                      <Icon className={`h-6 w-6 ${item.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-text-main)' }}>
                        {item.title}
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
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
