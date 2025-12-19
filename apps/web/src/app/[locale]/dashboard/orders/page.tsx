"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, Badge, Button, Input } from '@zed-hosting/ui-kit';
import { Navigation } from '../../../../components/navigation';
import { useAuthStore } from '../../../../stores/auth-store';
import { apiClient } from '../../../../lib/api-client';
import { useNotificationContext } from '../../../../context/notification-context';
import { Download, Filter, Search } from 'lucide-react';

interface OrderDto {
  id: string;
  status: string;
  totalAmount: number;
  currency: string;
  notes?: string | null;
  createdAt: string;
  plan?: {
    name?: string;
    slug?: string;
    gameType?: string;
    monthlyPrice?: number;
    hourlyPrice?: number | null;
    setupFee?: number | null;
  };
  priceSnapshot?: any;
}

export default function OrdersPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'hu';
  const { isAuthenticated, accessToken } = useAuthStore();
  const notifications = useNotificationContext();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('date-desc');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (accessToken) {
      apiClient.setAccessToken(accessToken);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }
    const load = async () => {
      try {
        const data = await apiClient.get<OrderDto[]>(`/orders`);
        setOrders(data || []);
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
    load();
  }, [isAuthenticated, locale, notifications, router]);

  const formatHuf = (amount: number) => `${(amount / 100).toLocaleString('hu-HU')} Ft`;

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
      default:
        return 'default';
    }
  };

  // Filter and sort orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.plan?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.plan?.gameType?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case 'date-asc':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'date-desc':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'price-asc':
        return a.totalAmount - b.totalAmount;
      case 'price-desc':
        return b.totalAmount - a.totalAmount;
      default:
        return 0;
    }
  });

  const paginatedOrders = sortedOrders.slice((page - 1) * 10, page * 10);
  const totalPages = Math.ceil(sortedOrders.length / 10);

  const handleExportCSV = () => {
    const csv = [
      ['Rendelés ID', 'Csomag', 'Játék', 'Összeg', 'Státusz', 'Dátum'],
      ...sortedOrders.map(order => [
        order.id,
        order.plan?.name || '-',
        order.plan?.gameType || '-',
        formatHuf(order.totalAmount),
        order.status,
        new Date(order.createdAt).toLocaleDateString('hu-HU'),
      ]),
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rendelesek_${new Date().toLocaleDateString('hu-HU')}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    notifications.addNotification({
      type: 'success',
      title: 'Exportálva',
      message: 'Rendelések CSV-ben exportálva.',
    });
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen" style={{ backgroundColor: '#0a0a0a', color: '#f8fafc' }}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-gray-400">Fiókom</p>
              <h1 className="text-3xl font-bold">Rendeléseim</h1>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={handleExportCSV}
                className="flex items-center gap-2"
                disabled={sortedOrders.length === 0}
              >
                <Download className="h-4 w-4" />
                Exportálás
              </Button>
              <Link href={`/${locale}/plans`} className="text-sm text-primary-400 hover:text-primary-300 transition">
                + Új csomag
              </Link>
            </div>
          </div>

          {/* Filters and Search */}
          {orders.length > 0 && (
            <Card className="p-4 bg-background-surface text-text-primary mb-6">
              <div className="grid gap-4 md:grid-cols-3">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium mb-2">Keresés</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-text-muted" />
                    <Input
                      type="text"
                      placeholder="Rendelés ID, csomag, játék..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(1);
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">Státusz</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 bg-background-surface border border-border rounded-lg text-text-primary"
                  >
                    <option value="ALL">Összes</option>
                    <option value="PAID">Fizetve</option>
                    <option value="ACTIVE">Aktív</option>
                    <option value="PENDING">Függőben</option>
                    <option value="PAYMENT_PENDING">Fizetés várakozik</option>
                    <option value="PROVISIONING">Felépítés alatt</option>
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-sm font-medium mb-2">Rendezés</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 bg-background-surface border border-border rounded-lg text-text-primary"
                  >
                    <option value="date-desc">Legfrissebb először</option>
                    <option value="date-asc">Legrégebbi először</option>
                    <option value="price-desc">Legdrágább először</option>
                    <option value="price-asc">Legolcsóbb először</option>
                  </select>
                </div>
              </div>

              {/* Results count */}
              <p className="text-sm text-text-muted mt-4">
                {sortedOrders.length} rendelés találva
              </p>
            </Card>
          )}

          {loading ? (
            <p className="text-gray-400">Betöltés...</p>
          ) : orders.length === 0 ? (
            <Card className="p-6 bg-background-surface text-text-primary">
              <p>Még nincs rendelésed.</p>
              <div className="mt-4">
                <Button variant="primary" onClick={() => router.push(`/${locale}/plans`)}>
                  Válassz csomagot
                </Button>
              </div>
            </Card>
          ) : sortedOrders.length === 0 ? (
            <Card className="p-6 bg-background-surface text-text-primary">
              <p>Nincs rendelés a szűrési feltételeknek megfelelően.</p>
            </Card>
          ) : (
            <div>
              <div className="grid gap-4">
                {paginatedOrders.map((order) => (
                  <Card key={order.id} className="p-6 bg-background-surface text-text-primary">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={statusVariant(order.status)} size="sm">{order.status}</Badge>
                          {order.notes && <Badge variant="default" size="sm">{order.notes}</Badge>}
                        </div>
                        <p className="text-lg font-semibold">{order.plan?.name || 'Ismeretlen csomag'}</p>
                        <p className="text-sm text-text-secondary uppercase">{order.plan?.gameType}</p>
                        <p className="text-sm text-text-secondary mt-1">
                          Rendelés ID: {order.id}
                        </p>
                        <p className="text-sm text-text-secondary">
                          Dátum: {new Date(order.createdAt).toLocaleString('hu-HU')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary-400">{formatHuf(order.totalAmount)}</p>
                        {order.plan?.slug && (
                          <Link
                            href={`/${locale}/dashboard/orders/${order.id}`}
                            className="text-sm text-primary-300 hover:text-primary-200"
                          >
                            Rendelés részletei
                          </Link>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <Button
                    variant="secondary"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Előző
                  </Button>
                  <span className="text-text-primary">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Következő
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
