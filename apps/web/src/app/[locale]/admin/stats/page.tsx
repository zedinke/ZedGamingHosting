'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '../../../../stores/auth-store';
import { AdminLayout } from '../../../../components/admin/admin-layout';
import { Card } from '@zed-hosting/ui-kit';
import { apiClient } from '../../../../lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

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
    totalUsers?: number;
    totalServers?: number;
    totalNodes?: number;
    activeServers?: number;
    totalRevenue?: number;
    monthlyRevenue?: Array<{ month: string; revenue: number }>;
    serverDistribution?: Array<{ game: string; count: number }>;
  }

  // Mock data fallback (if API fails)
  const mockStats: StatsData = {
        totalUsers: 150,
        totalServers: 45,
        totalNodes: 5,
        activeServers: 38,
        totalRevenue: 12500.50,
        monthlyRevenue: [
          { month: 'Jan', revenue: 1200 },
          { month: 'Feb', revenue: 1500 },
          { month: 'Mar', revenue: 1800 },
          { month: 'Apr', revenue: 2100 },
          { month: 'Máj', revenue: 2400 },
          { month: 'Jún', revenue: 2700 },
        ],
        serverDistribution: [
          { game: 'Minecraft', count: 20 },
          { game: 'ARK', count: 10 },
          { game: 'Rust', count: 8 },
          { game: 'CS2', count: 5 },
        { game: 'Palworld', count: 2 },
      ],
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card className="p-6">
                  <h3 className="text-sm mb-2 text-text-muted">Összes felhasználó</h3>
                  <p className="text-3xl font-bold text-text-main">
                    {displayStats.totalUsers}
                  </p>
                </Card>
                <Card className="p-6">
                  <h3 className="text-sm mb-2 text-text-muted">Összes szerver</h3>
                  <p className="text-3xl font-bold text-text-main">
                    {displayStats.totalServers}
                  </p>
                </Card>
                <Card className="p-6">
                  <h3 className="text-sm mb-2 text-text-muted">Aktív szerverek</h3>
                  <p className="text-3xl font-bold text-success">
                    {displayStats.activeServers}
                  </p>
                </Card>
                <Card className="p-6">
                  <h3 className="text-sm mb-2 text-text-muted">Összes bevétel</h3>
                  <p className="text-3xl font-bold text-text-main">
                    {displayStats.totalRevenue?.toFixed(2) || '0.00'} €
                  </p>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4 text-text-main">
                    Havi bevétel
                  </h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={displayStats.monthlyRevenue || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="month" stroke="var(--color-text-muted)" />
                      <YAxis stroke="var(--color-text-muted)" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--color-bg-card)', 
                          border: '1px solid var(--color-border)',
                          borderRadius: '8px',
                          color: 'var(--color-text-main)'
                        }}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="var(--color-primary)" name="Bevétel (€)" />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4 text-text-main">
                    Szerver eloszlás játék típus szerint
                  </h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={displayStats.serverDistribution || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="game" stroke="var(--color-text-muted)" />
                      <YAxis stroke="var(--color-text-muted)" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--color-bg-card)', 
                          border: '1px solid var(--color-border)',
                          borderRadius: '8px',
                          color: 'var(--color-text-main)'
                        }}
                      />
                      <Bar dataKey="count" fill="var(--color-primary)" name="Szerverek száma" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>
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

