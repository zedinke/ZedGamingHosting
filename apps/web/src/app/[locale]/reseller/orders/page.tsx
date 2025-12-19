'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useAuthStore } from '../../../../stores/auth-store';
import { AdminLayout } from '../../../../components/admin/admin-layout';
import { Card, Button } from '@zed-hosting/ui-kit';
import { apiClient } from '../../../../lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import { ListSkeleton } from '../../../../components/loading-skeleton';
import { Pagination } from '../../../../components/pagination';
import { BackButton } from '../../../../components/back-button';

interface Order {
  id: string;
  userId: string;
  planId: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  user?: {
    email: string;
  };
  plan?: {
    name: string;
    basePrice: number;
  };
}

export default function ResellerOrdersPage() {
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

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['reseller-orders'],
    queryFn: async () => {
      return await apiClient.get<Order[]>('/admin/orders');
    },
    enabled: isHydrated && isAuthenticated && !!accessToken,
  });

  const filteredOrders = orders?.filter((order) => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesStatus;
  }) || [];

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  if (!isHydrated) {
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

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'REFUNDED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <AdminLayout title="Reseller Rendelések">
      <div>
        <div className="mb-4 flex justify-end">
          <BackButton fallbackHref={`/${locale}/reseller`} />
        </div>
        <div className="mb-6">
          <p className="text-text-muted">
            Reseller rendelésének nyomon követése
          </p>
        </div>

        <div className="mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-border text-sm bg-background-card text-text-primary"
          >
            <option value="all">Minden státusz</option>
            <option value="PAID">Fizetve</option>
            <option value="PENDING">Függőben</option>
            <option value="FAILED">Sikertelen</option>
            <option value="REFUNDED">Visszatérített</option>
          </select>
        </div>

        {isLoading ? (
          <ListSkeleton items={5} />
        ) : filteredOrders.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-text-muted">
              {statusFilter !== 'all' ? 'Nincs találat' : 'Nincs rendelés'}
            </p>
          </Card>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {paginatedOrders.map((order) => (
                <Card key={order.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-lg font-semibold text-text-primary">
                          Rendelés #{order.id.substring(0, 8)}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-text-muted">Felhasználó</p>
                          <p className="text-text-primary font-medium">{order.user?.email || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-text-muted">Csomag</p>
                          <p className="text-text-primary font-medium">{order.plan?.name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-text-muted">Összeg</p>
                          <p className="text-text-primary font-medium">{order.totalAmount.toFixed(2)} €</p>
                        </div>
                        <div>
                          <p className="text-text-muted">Fizetési mód</p>
                          <p className="text-text-primary font-medium">{order.paymentMethod}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/${locale}/admin/orders/${order.id}`)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
