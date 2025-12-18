'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '../../../../../stores/auth-store';
import { AdminLayout } from '../../../../../components/admin/admin-layout';
import { Card, Button } from '@zed-hosting/ui-kit';
import { ArrowLeft, RefreshCw } from 'lucide-react';

interface OrderDetail {
  id: string;
  user: { id: string; email: string };
  plan?: { id: string; name: string; basePrice: number };
  gameServer?: { id: string; hostname: string; slots: number };
  totalAmount: number;
  status: string;
  paymentMethod: string;
  paymentId?: string;
  invoiceUrl?: string;
  createdAt: string;
  paidAt?: string;
  refundedAt?: string;
}

export default function AdminOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated } = useAuthStore();
  const locale = (params.locale as string) || 'hu';
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refunding, setRefunding] = useState(false);

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

    fetchOrderDetail();
  }, [isAuthenticated, user, router, locale, orderId]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push(`/${locale}/login`);
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 403) {
        setError('Hozzáférés megtagadva');
        return;
      }

      if (!response.ok) {
        throw new Error('Rendelés lekérése sikertelen');
      }

      const data = await response.json();
      setOrder(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!confirm('Biztosan visszautalja ezt a rendelést?')) return;

    try {
      setRefunding(true);
      const token = localStorage.getItem('accessToken');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/orders/${orderId}/refund`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reason: 'Admin manual refund',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Visszautalás sikertelen');
      }

      alert('Rendelés sikeresen visszautalva!');
      fetchOrderDetail();
    } catch (err: any) {
      alert(`Hiba: ${err.message}`);
    } finally {
      setRefunding(false);
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'text-green-600';
      case 'PENDING':
        return 'text-yellow-600';
      case 'FAILED':
        return 'text-red-600';
      case 'REFUNDED':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Rendelés Részletek">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-xl text-text-muted">Betöltés...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !order) {
    return (
      <AdminLayout title="Rendelés Részletek">
        <Card className="p-6 max-w-md mx-auto">
          <h2 className="text-xl font-bold text-red-600 mb-2">Hiba</h2>
          <p>{error || 'Rendelés nem található'}</p>
          <Button
            onClick={() => router.push(`/${locale}/admin/orders`)}
            className="mt-4"
          >
            Vissza a rendelésekhez
          </Button>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Rendelés #${order.id.substring(0, 8)}`}>
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={() => router.push(`/${locale}/admin/orders`)}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Vissza
          </Button>
          <h1 className="text-3xl font-bold text-text-primary">
            Rendelés #{order.id.substring(0, 8)}
          </h1>
          <span className={`text-2xl font-bold ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Order Info */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 text-text-primary">
              Rendelés Információk
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-text-muted">Rendelés ID:</span>
                <span className="font-mono text-sm text-text-primary">{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Létrehozva:</span>
                <span className="text-text-primary">{formatDate(order.createdAt)}</span>
              </div>
              {order.paidAt && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Fizetve:</span>
                  <span className="text-text-primary">{formatDate(order.paidAt)}</span>
                </div>
              )}
              {order.refundedAt && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Visszautalva:</span>
                  <span className="text-text-primary">{formatDate(order.refundedAt)}</span>
                </div>
              )}
              <div className="flex justify-between items-center border-t pt-3 border-border-default">
                <span className="text-lg font-semibold text-text-primary">Végösszeg:</span>
                <span className="text-2xl font-bold text-text-primary">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </div>
          </Card>

          {/* Payment Info */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 text-text-primary">
              Fizetési Információk
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-text-muted">Fizetési mód:</span>
                <span className="font-semibold text-text-primary">{order.paymentMethod}</span>
              </div>
              {order.paymentId && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Tranzakció ID:</span>
                  <span className="font-mono text-sm text-text-primary">{order.paymentId}</span>
                </div>
              )}
              {order.invoiceUrl && (
                <div className="flex justify-between items-center">
                  <span className="text-text-muted">Számla:</span>
                  <a
                    href={order.invoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Letöltés
                  </a>
                </div>
              )}
            </div>
          </Card>

          {/* User Info */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 text-text-primary">
              Felhasználó
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-text-muted">Email:</span>
                <span className="text-text-primary">{order.user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">User ID:</span>
                <span className="font-mono text-sm text-text-primary">{order.user.id}</span>
              </div>
              <Button
                onClick={() => router.push(`/${locale}/admin/users/${order.user.id}`)}
                variant="outline"
                className="w-full mt-2"
              >
                Felhasználó Megtekintése
              </Button>
            </div>
          </Card>

          {/* Plan Info */}
          {order.plan && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 text-text-primary">
                Csomag Információk
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-text-muted">Csomag neve:</span>
                  <span className="font-semibold text-text-primary">{order.plan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Alap ár:</span>
                  <span className="text-text-primary">{formatCurrency(order.plan.basePrice)}</span>
                </div>
                {order.gameServer && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Szerver hostname:</span>
                      <span className="font-mono text-sm text-text-primary">
                        {order.gameServer.hostname}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Slot-ok:</span>
                      <span className="text-text-primary">{order.gameServer.slots}</span>
                    </div>
                  </>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Admin Actions */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 text-text-primary">
            Admin Műveletek
          </h2>
          <div className="flex gap-4">
            {order.status === 'PAID' && (
              <Button
                onClick={handleRefund}
                disabled={refunding}
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                {refunding ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Visszautalás folyamatban...
                  </>
                ) : (
                  'Rendelés Visszautalása'
                )}
              </Button>
            )}
            <Button
              onClick={fetchOrderDetail}
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Frissítés
            </Button>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
