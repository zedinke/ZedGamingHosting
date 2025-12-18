"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, Badge } from '@zed-hosting/ui-kit';
import { Navigation } from '../../../../../components/navigation';
import { useAuthStore } from '../../../../../stores/auth-store';
import { apiClient } from '../../../../../lib/api-client';
import { useNotificationContext } from '../../../../../context/notification-context';

interface Order {
  id: string;
  userId: string;
  status: string;
  totalAmount: number;
  currency: string;
  paymentMethod?: string | null;
  paymentId?: string | null;
  paidAt?: string | null;
  createdAt: string;
  user?: {
    email: string;
    username: string;
  };
  plan?: {
    name: string;
    slug: string;
  };
}

export default function AdminPaymentsPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'hu';
  const { isAuthenticated, accessToken, role } = useAuthStore();
  const notifications = useNotificationContext();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'refunded'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (accessToken) {
      apiClient.setAccessToken(accessToken);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!isAuthenticated || role !== 'ADMIN') {
      router.push(`/${locale}/login`);
      return;
    }
    loadOrders();
  }, [isAuthenticated, role, locale, router]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      // Admin endpoint to fetch all orders
      const data = await apiClient.get<Order[]>('/admin/orders');
      setOrders(data);
    } catch (e: any) {
      notifications.addNotification({
        type: 'error',
        title: 'Hiba',
        message: e?.message || 'Nem sikerült betölteni a rendeléseket.',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatHuf = (amount: number) => `${(amount / 100).toLocaleString('hu-HU')} Ft`;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusVariant = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'ACTIVE':
        return 'success';
      case 'PAYMENT_PENDING':
      case 'PENDING':
        return 'warning';
      case 'PROVISIONING':
        return 'info';
      case 'CANCELLED':
      case 'REFUNDED':
        return 'default';
      default:
        return 'default';
    }
  };

  const paymentMethodLabel = (method?: string | null) => {
    if (!method) return 'N/A';
    switch (method) {
      case 'mock':
        return '🧪 Teszt';
      case 'barion':
        return '💳 Barion';
      case 'paypal':
        return '🅿️ PayPal';
      case 'upay':
        return '💳 Upay';
      case 'stripe':
        return '💳 Stripe';
      default:
        return method;
    }
  };

  const filteredOrders = orders.filter((order) => {
    // Filter by status
    if (filter === 'paid' && order.status !== 'PAID' && order.status !== 'ACTIVE') return false;
    if (filter === 'pending' && order.status !== 'PAYMENT_PENDING' && order.status !== 'PENDING') return false;
    if (filter === 'refunded' && order.status !== 'REFUNDED' && order.status !== 'CANCELLED') return false;

    // Search by user email, username, order ID, payment ID
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        order.id.toLowerCase().includes(query) ||
        order.user?.email.toLowerCase().includes(query) ||
        order.user?.username.toLowerCase().includes(query) ||
        order.paymentId?.toLowerCase().includes(query) ||
        order.plan?.name.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Calculate statistics
  const stats = {
    total: orders.length,
    paid: orders.filter((o) => o.status === 'PAID' || o.status === 'ACTIVE').length,
    pending: orders.filter((o) => o.status === 'PAYMENT_PENDING' || o.status === 'PENDING').length,
    refunded: orders.filter((o) => o.status === 'REFUNDED' || o.status === 'CANCELLED').length,
    totalRevenue: orders
      .filter((o) => o.status === 'PAID' || o.status === 'ACTIVE')
      .reduce((sum, o) => sum + o.totalAmount, 0),
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen" style={{ backgroundColor: '#0a0a0a', color: '#f8fafc' }}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link href={`/${locale}/admin`} className="text-sm text-primary-400 hover:text-primary-300 transition">
                ← Vissza az admin panelhez
              </Link>
              <h1 className="text-3xl font-bold mt-2">Fizetési tranzakciók</h1>
            </div>
            <Button onClick={loadOrders} variant="outline" size="sm">
              🔄 Frissítés
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-5 mb-6">
            <Card className="p-4 bg-background-surface text-text-primary">
              <p className="text-sm text-text-secondary">Összes rendelés</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </Card>
            <Card className="p-4 bg-background-surface text-text-primary">
              <p className="text-sm text-text-secondary">Fizetett</p>
              <p className="text-2xl font-bold text-green-400">{stats.paid}</p>
            </Card>
            <Card className="p-4 bg-background-surface text-text-primary">
              <p className="text-sm text-text-secondary">Folyamatban</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
            </Card>
            <Card className="p-4 bg-background-surface text-text-primary">
              <p className="text-sm text-text-secondary">Visszatérítve</p>
              <p className="text-2xl font-bold text-gray-400">{stats.refunded}</p>
            </Card>
            <Card className="p-4 bg-background-surface text-text-primary">
              <p className="text-sm text-text-secondary">Bevétel</p>
              <p className="text-2xl font-bold text-primary-400">{formatHuf(stats.totalRevenue)}</p>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="p-4 mb-6 bg-background-surface">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-2">
                <Button
                  onClick={() => setFilter('all')}
                  variant={filter === 'all' ? 'primary' : 'outline'}
                  size="sm"
                >
                  Összes
                </Button>
                <Button
                  onClick={() => setFilter('paid')}
                  variant={filter === 'paid' ? 'primary' : 'outline'}
                  size="sm"
                >
                  Fizetett
                </Button>
                <Button
                  onClick={() => setFilter('pending')}
                  variant={filter === 'pending' ? 'primary' : 'outline'}
                  size="sm"
                >
                  Folyamatban
                </Button>
                <Button
                  onClick={() => setFilter('refunded')}
                  variant={filter === 'refunded' ? 'primary' : 'outline'}
                  size="sm"
                >
                  Visszatérítve
                </Button>
              </div>
              <input
                type="text"
                placeholder="🔍 Keresés (email, ID, fizetési ID...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 rounded-lg bg-background-default text-text-primary border border-gray-700 focus:border-primary-400 outline-none"
                style={{ minWidth: '300px' }}
              />
            </div>
          </Card>

          {/* Orders Table */}
          {loading ? (
            <p className="text-text-secondary">Betöltés...</p>
          ) : filteredOrders.length === 0 ? (
            <Card className="p-6 bg-background-surface text-center">
              <p className="text-text-secondary">Nincsenek megjeleníthető rendelések.</p>
            </Card>
          ) : (
            <Card className="p-0 bg-background-surface overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-background-default">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">Rendelés ID</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">Felhasználó</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">Csomag</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">Összeg</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">Fizetési mód</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">Fizetési ID</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">Státusz</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">Létrehozva</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">Kifizetve</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">Műveletek</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-background-default/50 transition">
                        <td className="px-4 py-3 text-sm">
                          <code className="text-primary-400">{order.id.substring(0, 8)}</code>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div>
                            <div className="font-semibold">{order.user?.username || 'N/A'}</div>
                            <div className="text-text-secondary text-xs">{order.user?.email || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{order.plan?.name || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm font-semibold">{formatHuf(order.totalAmount)}</td>
                        <td className="px-4 py-3 text-sm">{paymentMethodLabel(order.paymentMethod)}</td>
                        <td className="px-4 py-3 text-sm">
                          {order.paymentId ? (
                            <code className="text-xs text-gray-400">{order.paymentId.substring(0, 16)}...</code>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Badge variant={statusVariant(order.status)} size="sm">
                            {order.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(order.createdAt)}</td>
                        <td className="px-4 py-3 text-sm text-text-secondary">
                          {order.paidAt ? formatDate(order.paidAt) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Link
                            href={`/${locale}/admin/payments/${order.id}`}
                            className="text-primary-400 hover:text-primary-300 transition"
                          >
                            Részletek →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
