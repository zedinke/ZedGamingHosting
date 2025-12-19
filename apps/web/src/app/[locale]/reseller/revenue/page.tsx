'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useAuthStore } from '../../../../stores/auth-store';
import { AdminLayout } from '../../../../components/admin/admin-layout';
import { Card } from '@zed-hosting/ui-kit';
import { apiClient } from '../../../../lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { BackButton } from '../../../../components/back-button';
import { DollarSign, TrendingUp, Calendar, PieChart } from 'lucide-react';

interface RevenueData {
  orders?: {
    total: number;
    paid: number;
    pending: number;
  };
  revenue?: {
    total: number;
    thisMonth: number;
    lastMonth: number;
  };
}

export default function ResellerRevenuePage() {
  const router = useRouter();
  const params = useParams();
  const { user: currentUser, isAuthenticated, accessToken } = useAuthStore();
  const locale = (params.locale as string) || 'hu';
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
    if (isHydrated && isAuthenticated && userRole !== 'RESELLER_ADMIN') {
      router.push(`/${locale}/dashboard`);
      return;
    }
  }, [isAuthenticated, isHydrated, currentUser, router, locale]);

  const { data: revenueData, isLoading } = useQuery<RevenueData>({
    queryKey: ['reseller-revenue'],
    queryFn: async () => {
      return await apiClient.get<RevenueData>('/admin/stats');
    },
    enabled: isHydrated && isAuthenticated && !!accessToken,
    refetchInterval: 300000, // 5 percenként frissítünk
  });

  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-surface">
        <p className="text-text-muted">Betöltés...</p>
      </div>
    );
  }

  const userRole = currentUser?.role?.toUpperCase();
  if (!isAuthenticated || userRole !== 'RESELLER_ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-surface">
        <p className="text-text-muted">Átirányítás...</p>
      </div>
    );
  }

  const monthGrowth = revenueData?.revenue?.thisMonth && revenueData?.revenue?.lastMonth
    ? (((revenueData.revenue.thisMonth - revenueData.revenue.lastMonth) / revenueData.revenue.lastMonth) * 100).toFixed(1)
    : 0;

  return (
    <AdminLayout title="Bevételek">
      <div>
        <div className="mb-4 flex justify-end">
          <BackButton fallbackHref={`/${locale}/reseller`} />
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-text-primary">
            Bevétel Nyomon Követés
          </h1>
          <p className="text-text-muted">
            A reseller bevételének részletes analitikája
          </p>
        </div>

        {/* Revenue Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Összes bevétel</p>
                <p className="text-3xl font-bold text-blue-700">
                  {revenueData?.revenue?.total?.toFixed(0) || 0}€
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-blue-500 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Havi bevétel (aktuális)</p>
                <p className="text-3xl font-bold text-green-700">
                  {revenueData?.revenue?.thisMonth?.toFixed(0) || 0}€
                </p>
              </div>
              <Calendar className="h-12 w-12 text-green-500 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Havi bevétel (előző)</p>
                <p className="text-3xl font-bold text-purple-700">
                  {revenueData?.revenue?.lastMonth?.toFixed(0) || 0}€
                </p>
              </div>
              <Calendar className="h-12 w-12 text-purple-500 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Havi nöV. (%)</p>
                <p className={`text-3xl font-bold ${monthGrowth > 0 ? 'text-orange-700' : 'text-red-700'}`}>
                  {monthGrowth > 0 ? '+' : ''}{monthGrowth}%
                </p>
              </div>
              <TrendingUp className="h-12 w-12 text-orange-500 opacity-50" />
            </div>
          </Card>
        </div>

        {/* Order Statistics */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-text-primary flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Rendelés Statisztikák
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-background-surface rounded-lg">
              <p className="text-text-muted mb-1">Összes rendelés</p>
              <p className="text-3xl font-bold text-text-primary">
                {revenueData?.orders?.total || 0}
              </p>
            </div>
            <div className="text-center p-4 bg-background-surface rounded-lg">
              <p className="text-text-muted mb-1">Fizetett rendelés</p>
              <p className="text-3xl font-bold text-green-600">
                {revenueData?.orders?.paid || 0}
              </p>
              <p className="text-xs text-text-muted mt-2">
                {revenueData?.orders?.total ? ((revenueData.orders.paid / revenueData.orders.total) * 100).toFixed(0) : 0}%
              </p>
            </div>
            <div className="text-center p-4 bg-background-surface rounded-lg">
              <p className="text-text-muted mb-1">Függőben lévő rendelés</p>
              <p className="text-3xl font-bold text-yellow-600">
                {revenueData?.orders?.pending || 0}
              </p>
              <p className="text-xs text-text-muted mt-2">
                {revenueData?.orders?.total ? ((revenueData.orders.pending / revenueData.orders.total) * 100).toFixed(0) : 0}%
              </p>
            </div>
          </div>
        </Card>

        {/* Revenue Insights */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-text-primary">Bevétel Insights</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-background-surface rounded-lg">
              <span className="text-text-muted">Átlagos rendelés érték</span>
              <span className="text-lg font-bold text-text-primary">
                {revenueData?.orders?.total && revenueData?.revenue?.total
                  ? (revenueData.revenue.total / revenueData.orders.total).toFixed(2)
                  : 0}€
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-background-surface rounded-lg">
              <span className="text-text-muted">Havi havi növekedés</span>
              <span className={`text-lg font-bold ${monthGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {monthGrowth > 0 ? '↑' : '↓'} {Math.abs(Number(monthGrowth))}%
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-background-surface rounded-lg">
              <span className="text-text-muted">Konverziós ráta</span>
              <span className="text-lg font-bold text-text-primary">
                {revenueData?.orders?.total
                  ? ((revenueData.orders.paid / revenueData.orders.total) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
