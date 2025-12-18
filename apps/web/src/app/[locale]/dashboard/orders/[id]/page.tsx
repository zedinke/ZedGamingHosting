"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, Badge } from '@zed-hosting/ui-kit';
import { Navigation } from '../../../../../components/navigation';
import { useAuthStore } from '../../../../../stores/auth-store';
import { apiClient } from '../../../../../lib/api-client';
import { useNotificationContext } from '../../../../../context/notification-context';

interface OrderDetailDto {
  id: string;
  status: string;
  totalAmount: number;
  currency: string;
  paymentMethod?: string | null;
  paidAt?: string | null;
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

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'hu';
  const orderId = (params?.id as string) || '';
  const { isAuthenticated, accessToken } = useAuthStore();
  const notifications = useNotificationContext();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetailDto | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

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
        const data = await apiClient.get<OrderDetailDto>(`/orders/${orderId}`);
        setOrder(data);
      } catch (e: any) {
        notifications.addNotification({
          type: 'error',
          title: 'Hiba',
          message: e?.message || 'Nem sikerült betölteni a rendelést.',
        });
        router.push(`/${locale}/dashboard/orders`);
      } finally {
        setLoading(false);
      }
    };
    if (orderId) load();
  }, [orderId, isAuthenticated, locale, notifications, router]);

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

  const handlePayment = async (method: 'mock' | 'barion' | 'stripe') => {
    if (!orderId) return;
    setPaymentLoading(true);
    try {
      const result = await apiClient.post(`/orders/${orderId}/payment`, {
        method,
      });

      if (method === 'mock') {
        // Mock payment immediately succeeds
        setOrder((prev) =>
          prev ? { ...prev, status: 'PAID', paymentMethod: 'mock', paidAt: new Date().toISOString() } : null
        );
        notifications.addNotification({
          type: 'success',
          title: 'Fizetés sikeres',
          message: 'A rendelés sikeresen kifizetésre került.',
        });
      } else if (method === 'barion' || method === 'stripe') {
        // Redirect to payment gateway
        const resultData = result as { redirectUrl?: string; sessionUrl?: string };
        window.location.href = resultData.redirectUrl || resultData.sessionUrl || '';
      }
    } catch (e: any) {
      notifications.addNotification({
        type: 'error',
        title: 'Hiba',
        message: e?.message || 'A fizetés feldolgozása sikertelen.',
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!orderId || !confirm('Biztosan törlöd a rendelést? A fizetett összeg visszakerül az egyenlegedre.')) {
      return;
    }
    setCancelLoading(true);
    try {
      const result = (await apiClient.delete(`/orders/${orderId}`)) as OrderDetailDto;
      setOrder(result);
      notifications.addNotification({
        type: 'success',
        title: 'Rendelés törlödve',
        message: 'A rendelés sikeresen törlödve. A fizetett összeg visszakerült az egyenlegedre.',
      });
    } catch (e: any) {
      notifications.addNotification({
        type: 'error',
        title: 'Hiba',
        message: e?.message || 'A rendelés törlése sikertelen.',
      });
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-background-default">
          <div className="container mx-auto px-4 py-8">
            <p className="text-text-secondary">Betöltés...</p>
          </div>
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-background-default">
          <div className="container mx-auto px-4 py-8">
            <p className="text-text-secondary">Rendelés nem található.</p>
          </div>
        </div>
      </>
    );
  }

  const isPending = order.status === 'PAYMENT_PENDING' || order.status === 'PENDING';

  return (
    <>
      <Navigation />
      <div className="min-h-screen" style={{ backgroundColor: '#0a0a0a', color: '#f8fafc' }}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link href={`/${locale}/dashboard/orders`} className="text-sm text-primary-400 hover:text-primary-300 transition">
                ← Vissza a rendelésekhez
              </Link>
              <h1 className="text-3xl font-bold mt-2">Rendelés #{order.id.substring(0, 8)}</h1>
            </div>
            <Badge variant={statusVariant(order.status)} size="md">
              {order.status}
            </Badge>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Order Summary */}
            <Card className="md:col-span-2 p-6 bg-background-surface text-text-primary">
              <h2 className="text-xl font-bold mb-4">Rendelés adatai</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Csomag:</span>
                  <span className="font-semibold">{order.plan?.name || 'Ismeretlen'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Típus:</span>
                  <span className="font-semibold">{order.plan?.gameType}</span>
                </div>
                {order.priceSnapshot?.billingCycle && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Számlázás:</span>
                    <span className="font-semibold">
                      {order.priceSnapshot.billingCycle === 'MONTHLY' ? 'Havi' : 'Óránkénti'}
                    </span>
                  </div>
                )}
                <div className="border-t border-white/10 pt-4 flex justify-between text-lg font-bold">
                  <span>Fizetendő:</span>
                  <span className="text-primary-400">{formatHuf(order.totalAmount)}</span>
                </div>
              </div>

              {order.notes && (
                <div className="mt-4 p-3 rounded bg-warning-900/20 border border-warning-700/30">
                  <p className="text-sm text-text-secondary">{order.notes}</p>
                </div>
              )}

              <div className="mt-6 text-sm text-text-secondary">
                <p>Rendelés dátuma: {new Date(order.createdAt).toLocaleString('hu-HU')}</p>
                {order.paidAt && <p>Fizetés dátuma: {new Date(order.paidAt).toLocaleString('hu-HU')}</p>}
              </div>

              {order.status === 'PAID' && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-sm text-text-secondary mb-3">Számla:</p>
                  <Button
                    onClick={() => window.open(`/api/orders/${orderId}/invoice/pdf`)}
                    variant="outline"
                    className="w-full text-green-400 border-green-600/30 hover:bg-green-900/10"
                  >
                    📄 Számla letöltése (PDF)
                  </Button>
                </div>
              )}
            </Card>

            {/* Payment Section */}
            <Card className="p-6 bg-background-surface text-text-primary">
              <h2 className="text-xl font-bold mb-4">Fizetés</h2>

              {isPending ? (
                <div className="space-y-3">
                  <p className="text-sm text-text-secondary mb-4">Válassz fizetési módot:</p>
                  <Button
                    onClick={() => handlePayment('mock')}
                    disabled={paymentLoading}
                    variant="primary"
                    className="w-full"
                  >
                    {paymentLoading ? 'Feldolgozás...' : 'Tesztelési fizetés'}
                  </Button>
                  <Button
                    onClick={() => handlePayment('barion')}
                    disabled={paymentLoading}
                    variant="outline"
                    className="w-full"
                  >
                    Barion
                  </Button>
                  <Button
                    onClick={() => handlePayment('stripe')}
                    disabled={paymentLoading}
                    variant="outline"
                    className="w-full"
                  >
                    Stripe
                  </Button>
                  <Button
                    onClick={handleCancelOrder}
                    disabled={cancelLoading || paymentLoading}
                    variant="outline"
                    className="w-full mt-4 !text-red-400 !border-red-600/30 hover:!bg-red-900/10"
                  >
                    {cancelLoading ? 'Törlés...' : '🗑️ Rendelés törlése'}
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-text-secondary mb-2">Fizetési módszer:</p>
                  <p className="font-semibold">{order.paymentMethod || 'N/A'}</p>
                  <p className="text-sm text-text-secondary mt-4 mb-2">Státusz:</p>
                  <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                  
                  {order.status !== 'CANCELLED' && order.status !== 'REFUNDED' && (
                    <Button
                      onClick={handleCancelOrder}
                      disabled={cancelLoading}
                      variant="outline"
                      className="w-full mt-4 !text-red-400 !border-red-600/30 hover:!bg-red-900/10"
                    >
                      {cancelLoading ? 'Törlés...' : '🗑️ Rendelés törlése'}
                    </Button>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
