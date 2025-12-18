"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, Badge, Button } from '@zed-hosting/ui-kit';
import { Navigation } from '../../../../components/navigation';
import { useAuthStore } from '../../../../stores/auth-store';
import { apiClient } from '../../../../lib/api-client';
import { useNotificationContext } from '../../../../context/notification-context';

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
            <Link href={`/${locale}/plans`} className="text-sm text-primary-400 hover:text-primary-300 transition">
              + Új csomag kiválasztása
            </Link>
          </div>

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
          ) : (
            <div className="grid gap-4">
              {orders.map((order) => (
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
                        Rendelés azonosító: {order.id}
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
          )}
        </div>
      </div>
    </>
  );
}
