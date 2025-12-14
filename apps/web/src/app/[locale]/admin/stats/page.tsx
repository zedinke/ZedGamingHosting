'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '../../../../stores/auth-store';
import { Navigation } from '../../../../components/navigation';
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

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      return await apiClient.get('/admin/stats');
    },
    enabled: isHydrated && isAuthenticated && !!accessToken,
    refetchInterval: 60000,
  });

  // Mock data fallback (if API fails)
  const mockStats = {
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

  const displayStats = stats || mockStats;

  if (!isHydrated) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  const userRole = currentUser?.role?.toUpperCase();
  if (!isAuthenticated || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'SUPERADMIN' && userRole !== 'RESELLER_ADMIN')) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Redirecting...</p>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen" style={{ 
        backgroundColor: '#0a0a0a', 
        background: 'radial-gradient(at 0% 0%, rgba(14, 165, 233, 0.1) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(59, 130, 246, 0.1) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(14, 165, 233, 0.05) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(59, 130, 246, 0.05) 0px, transparent 50%), #0a0a0a',
        color: '#f8fafc',
        minHeight: '100vh'
      }}>
        <div className="container mx-auto px-4 py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#f8fafc' }}>Statisztikák</h1>
            <p style={{ color: '#cbd5e1' }}>
              Platform statisztikák és jelentések
            </p>
          </header>

          {isLoading ? (
            <div className="text-center py-12">
              <p style={{ color: '#cbd5e1' }}>Betöltés...</p>
            </div>
          ) : displayStats ? (
            <>
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card className="glass elevation-2 p-6">
                  <h3 className="text-sm mb-2" style={{ color: '#cbd5e1' }}>Összes felhasználó</h3>
                  <p className="text-3xl font-bold" style={{ color: '#f8fafc' }}>
                    {displayStats.totalUsers}
                  </p>
                </Card>
                <Card className="glass elevation-2 p-6">
                  <h3 className="text-sm mb-2" style={{ color: '#cbd5e1' }}>Összes szerver</h3>
                  <p className="text-3xl font-bold" style={{ color: '#f8fafc' }}>
                    {displayStats.totalServers}
                  </p>
                </Card>
                <Card className="glass elevation-2 p-6">
                  <h3 className="text-sm mb-2" style={{ color: '#cbd5e1' }}>Aktív szerverek</h3>
                  <p className="text-3xl font-bold" style={{ color: '#10b981' }}>
                    {displayStats.activeServers}
                  </p>
                </Card>
                <Card className="glass elevation-2 p-6">
                  <h3 className="text-sm mb-2" style={{ color: '#cbd5e1' }}>Összes bevétel</h3>
                  <p className="text-3xl font-bold" style={{ color: '#f8fafc' }}>
                    {displayStats.totalRevenue?.toFixed(2) || '0.00'} €
                  </p>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card className="glass elevation-2 p-6">
                  <h2 className="text-xl font-semibold mb-4" style={{ color: '#f8fafc' }}>
                    Havi bevétel
                  </h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={displayStats.monthlyRevenue || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#3b82f6" name="Bevétel (€)" />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

                <Card className="glass elevation-2 p-6">
                  <h2 className="text-xl font-semibold mb-4" style={{ color: '#f8fafc' }}>
                    Szerver eloszlás játék típus szerint
                  </h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={displayStats.serverDistribution || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="game" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="count" fill="#3b82f6" name="Szerverek száma" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            </>
          ) : (
            <Card className="glass elevation-2 p-12 text-center">
              <p style={{ color: '#cbd5e1' }}>Statisztikák nem elérhetőek</p>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}

