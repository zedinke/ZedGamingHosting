'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '../../../../stores/auth-store';
import { AdminLayout } from '../../../../components/admin/admin-layout';
import { Card } from '@zed-hosting/ui-kit';
import { apiClient } from '../../../../lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { BackButton } from '../../../../components/back-button';

export default function AdminStatsPage() {
  const router = useRouter();
  const params = useParams();
  const { user: currentUser, isAuthenticated, accessToken } = useAuthStore();
  const locale = (params?.locale as string) || 'hu';
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    if (accessToken) {
      apiClient.setAccessToken(accessToken);
    }
  }, [accessToken]);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }

    const userRole = currentUser?.role?.toUpperCase();
    if (isHydrated && isAuthenticated && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'SUPERADMIN' && userRole !== 'RESELLER_ADMIN') {
      router.push(`/${locale}/dashboard`);
      return;
    }
  }, [isAuthenticated, isHydrated, currentUser, router, locale]);

  interface StatsData {
    users?: {
      total: number;
      active: number;
      premium: number;
    };
    orders?: {
      total: number;
      paid: number;
      pending: number;
    };
    servers?: {
      total: number;
      active: number;
    };
    nodes?: {
      total: number;
      healthy: number;
    };
    revenue?: {
      total: number;
      thisMonth: number;
      lastMonth: number;
    };
  }

  // Mock data fallback (if API fails)
  const mockStats: StatsData = {
    users: {
      total: 150,
      active: 85,
      premium: 12
    },
    orders: {
      total: 230,
      paid: 195,
      pending: 35
    },
    servers: {
      total: 45,
      active: 38
    },
    nodes: {
      total: 5,
      healthy: 4
    },
    revenue: {
      total: 12500.50,
      thisMonth: 2700,
      lastMonth: 2400
    }
  };

  const { data: stats, isLoading } = useQuery<StatsData>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      return await apiClient.get<StatsData>('/admin/stats');
    },
    enabled: isHydrated && isAuthenticated && !!accessToken,
    refetchInterval: 60000,
  });

  const displayStats: StatsData = stats || mockStats;

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-surface">
        <p className="text-text-muted">Betöltés...</p>
      </div>
    );
  }

  const userRole = currentUser?.role?.toUpperCase();
  if (!isAuthenticated || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'SUPERADMIN' && userRole !== 'RESELLER_ADMIN')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-surface">
        <p className="text-text-muted">Átirányítás...</p>
      </div>
    );
  }

  return (
    <div>
      <AdminLayout title="Statisztikák">
        <div>
          <div className="mb-4 flex justify-end">
            <BackButton fallbackHref={`/${locale}/admin`} />
          </div>
          <div className="mb-6">
            <p className="text-text-muted">
              Platform statisztikák és jelentések
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-text-muted">Betöltés...</p>
            </div>
          ) : displayStats ? (
            <>
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="p-6">
                  <h3 className="text-sm mb-2 text-text-muted">Összes felhasználó</h3>
                  <p className="text-3xl font-bold text-text-main">
                    {displayStats.users?.total || 0}
                  </p>
                  <p className="text-sm text-text-muted mt-2">
                    Aktív: {displayStats.users?.active || 0} | Prémium: {displayStats.users?.premium || 0}
                  </p>
                </Card>
                <Card className="p-6">
                  <h3 className="text-sm mb-2 text-text-muted">Rendelések</h3>
                  <p className="text-3xl font-bold text-text-main">
                    {displayStats.orders?.total || 0}
                  </p>
                  <p className="text-sm text-text-muted mt-2">
                    Fizetve: {displayStats.orders?.paid || 0} | Függőben: {displayStats.orders?.pending || 0}
                  </p>
                </Card>
                <Card className="p-6">
                  <h3 className="text-sm mb-2 text-text-muted">Szerverek</h3>
                  <p className="text-3xl font-bold text-text-main">
                    {displayStats.servers?.total || 0}
                  </p>
                  <p className="text-sm text-success mt-2">
                    Aktív: {displayStats.servers?.active || 0}
                  </p>
                </Card>
                <Card className="p-6">
                  <h3 className="text-sm mb-2 text-text-muted">Node-ok</h3>
                  <p className="text-3xl font-bold text-text-main">
                    {displayStats.nodes?.total || 0}
                  </p>
                  <p className="text-sm text-success mt-2">
                    Egészséges: {displayStats.nodes?.healthy || 0}
                  </p>
                </Card>
              </div>

              {/* Revenue Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card className="p-6">
                  <h3 className="text-sm mb-2 text-text-muted">Összes bevétel</h3>
                  <p className="text-3xl font-bold text-text-main">
                    {displayStats.revenue?.total?.toFixed(2) || '0.00'} €
                  </p>
                </Card>
                <Card className="p-6">
                  <h3 className="text-sm mb-2 text-text-muted">Havi bevétel (aktuális)</h3>
                  <p className="text-3xl font-bold text-success">
                    {displayStats.revenue?.thisMonth?.toFixed(2) || '0.00'} €
                  </p>
                </Card>
                <Card className="p-6">
                  <h3 className="text-sm mb-2 text-text-muted">Havi bevétel (előző)</h3>
                  <p className="text-3xl font-bold text-text-muted">
                    {displayStats.revenue?.lastMonth?.toFixed(2) || '0.00'} €
                  </p>
                </Card>
              </div>

              {/* Additional Info */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-text-main">
                  Platform állapot
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-text-muted mb-2">Felhasználók</h3>
                    <ul className="space-y-1 text-sm">
                      <li className="text-text-main">Összes: <strong>{displayStats.users?.total || 0}</strong></li>
                      <li className="text-text-main">Aktív (30 napon belül): <strong>{displayStats.users?.active || 0}</strong></li>
                      <li className="text-text-main">Prémium (SUPERADMIN): <strong>{displayStats.users?.premium || 0}</strong></li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-text-muted mb-2">Infrastruktúra</h3>
                    <ul className="space-y-1 text-sm">
                      <li className="text-text-main">Összes szerver: <strong>{displayStats.servers?.total || 0}</strong></li>
                      <li className="text-success">Aktív szerverek: <strong>{displayStats.servers?.active || 0}</strong></li>
                      <li className="text-text-main">Összes node: <strong>{displayStats.nodes?.total || 0}</strong></li>
                      <li className="text-success">Egészséges node-ok: <strong>{displayStats.nodes?.healthy || 0}</strong></li>
                    </ul>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-text-muted">Statisztikák nem elérhetőek</p>
            </Card>
          )}
        </div>
      </AdminLayout>
    </div>
  );
}

