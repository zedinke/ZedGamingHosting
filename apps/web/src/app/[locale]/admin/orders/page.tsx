'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '../../../../stores/auth-store';
import { AdminLayout } from '../../../../components/admin/admin-layout';
import { Card, Button } from '@zed-hosting/ui-kit';
import { Search, Filter } from 'lucide-react';

interface Order {
  id: string;
  user: { id: string; email: string };
  plan?: { id: string; name: string; basePrice: number };
  totalAmount: number;
  status: string;
  paymentMethod: string;
  paymentId?: string;
  createdAt: string;
  paidAt?: string;
}

interface OrdersResponse {
  data: Order[];
  pagination: {
    skip: number;
    take: number;
    total: number;
    pages: number;
  };
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated } = useAuthStore();
  const locale = (params.locale as string) || 'hu';

  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState({ skip: 0, take: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }

    const userRole = user?.role?.toUpperCase();
    if (userRole !== 'ADMIN' && userRole !== 'SUPERADMIN' && userRole !== 'RESELLER_ADMIN') {
      router.push(`/${locale}/dashboard`);
      return;
    }

    fetchOrders();
  }, [isAuthenticated, user, router, locale, currentPage, statusFilter, paymentMethodFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push(`/${locale}/login`);
        return;
      }

      const skip = (currentPage - 1) * pagination.take;
      let url = `${process.env.NEXT_PUBLIC_API_URL}/admin/orders?skip=${skip}&take=${pagination.take}`;
      
      if (statusFilter) url += `&status=${statusFilter}`;
      if (paymentMethodFilter) url += `&paymentMethod=${paymentMethodFilter}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 403) {
        setError('Hozzáférés megtagadva - Admin jogosultság szükséges');
        return;
      }

      if (!response.ok) {
        throw new Error('Rendelések lekérése sikertelen');
      }

      const data: OrdersResponse = await response.json();
      setOrders(data.data);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'FAILED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'REFUNDED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toUpperCase()) {
      case 'PAYPAL':
        return '🅿️';
      case 'BARION':
        return '💳';
      case 'UPAY':
        return '💳';
      case 'STRIPE':
        return '💳';
      case 'MOCK':
        return '🧪';
      default:
        return '💰';
    }
  };

  if (loading && orders.length === 0) {
    return (
      <AdminLayout title="Rendelések Kezelése">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-xl text-text-muted">Betöltés...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Rendelések Kezelése">
        <Card className="p-6 max-w-md mx-auto">
          <h2 className="text-xl font-bold text-red-600 mb-2">Hiba</h2>
          <p>{error}</p>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Rendelések Kezelése">
      <div className="space-y-6">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-text-primary">
              Rendelések Kezelése
            </h1>
            <p className="text-text-muted">
              Összes rendelés: {pagination.total} | Oldalak: {pagination.pages}
            </p>
          </div>
        </header>

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-text-primary">
                <Filter className="inline w-4 h-4 mr-1" />
                Státusz
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border rounded-md bg-background-elevated border-border-default"
              >
                <option value="">Összes</option>
                <option value="PENDING">Függőben</option>
                <option value="PAID">Fizetve</option>
                <option value="FAILED">Sikertelen</option>
                <option value="REFUNDED">Visszautalva</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-text-primary">
                <Filter className="inline w-4 h-4 mr-1" />
                Fizetési Mód
              </label>
              <select
                value={paymentMethodFilter}
                onChange={(e) => {
                  setPaymentMethodFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border rounded-md bg-background-elevated border-border-default"
              >
                <option value="">Összes</option>
                <option value="PAYPAL">PayPal</option>
                <option value="BARION">Barion</option>
                <option value="UPAY">Upay</option>
                <option value="STRIPE">Stripe</option>
                <option value="MOCK">Mock (Teszt)</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setStatusFilter('');
                  setPaymentMethodFilter('');
                  setCurrentPage(1);
                }}
                variant="outline"
                className="w-full"
              >
                Szűrők Törlése
              </Button>
            </div>
          </div>
        </Card>

        {/* Orders Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background-elevated border-b border-border-default">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Felhasználó
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Csomag
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Összeg
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Fizetési Mód
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Státusz
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Létrehozva
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Műveletek
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-background-elevated transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-text-muted">
                      {order.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      {order.user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      {order.plan?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-text-primary">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      <span className="flex items-center gap-1">
                        {getPaymentMethodIcon(order.paymentMethod)}
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button
                        onClick={() => router.push(`/${locale}/admin/orders/${order.id}`)}
                        variant="outline"
                        size="sm"
                      >
                        Részletek
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              variant="outline"
            >
              Előző
            </Button>
            <span className="flex items-center px-4 text-text-primary">
              {currentPage} / {pagination.pages}
            </span>
            <Button
              onClick={() => setCurrentPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={currentPage === pagination.pages}
              variant="outline"
            >
              Következő
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
