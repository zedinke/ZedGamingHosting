'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, Button } from '@zed-hosting/ui-kit';
import { useAuthStore } from '../../../stores/auth-store';
import { apiClient } from '../../../lib/api-client';
import { useNotificationContext } from '../../../context/notification-context';

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'hu';
  const sp = useSearchParams();
  const { isAuthenticated, accessToken } = useAuthStore();
  const notifications = useNotificationContext();

  const planSlug = sp.get('plan') || '';
  const billing = (sp.get('billing') as 'monthly' | 'hourly') || 'monthly';
  const apiBilling = billing === 'monthly' ? 'MONTHLY' : 'HOURLY';
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any | null>(null);

  useEffect(() => {
    if (accessToken) apiClient.setAccessToken(accessToken);
  }, [accessToken]);

  useEffect(() => {
    if (!planSlug) {
      router.push(`/${locale}/plans`);
      return;
    }
    const run = async () => {
      try {
        const res = await fetch(`/api/plans/public/${planSlug}`);
        if (!res.ok) {
          router.push(`/${locale}/plans`);
          return;
        }
        const data = await res.json();
        setPlan(data);
      } catch {
        router.push(`/${locale}/plans`);
      }
    };
    run();
  }, [planSlug, router, locale]);

  const currentPrice = useMemo(() => {
    if (!plan) return 0;
    const base = billing === 'monthly' ? plan.monthlyPrice : (plan.hourlyPrice ?? plan.monthlyPrice);
    return (base || 0) + (plan.setupFee || 0);
  }, [plan, billing]);

  const placeOrder = async () => {
    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }
    if (!planSlug) return;
    setLoading(true);
    try {
      const order = await apiClient.post('/orders', {
        planSlug,
        billingCycle: apiBilling,
      });
      notifications.addNotification({
        type: 'success',
        title: 'Rendelés leadva',
        message: 'A rendelés sikeresen létrejött.'
      });
      router.push(`/${locale}/dashboard`);
      return order;
    } catch (e: any) {
      notifications.addNotification({
        type: 'error',
        title: 'Hiba',
        message: e?.message || 'A rendelés nem sikerült.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-default">
      <div className="container max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="flex items-center text-sm text-text-secondary">
            <Link href={`/${locale}`} className="hover:text-primary-400 transition">Főoldal</Link>
            <span className="mx-2">/</span>
            <Link href={`/${locale}/plans`} className="hover:text-primary-400 transition">Csomagok</Link>
            <span className="mx-2">/</span>
            <span className="text-text-primary">Pénztár</span>
          </div>
        </div>

        <Card className="p-8 bg-background-surface">
          <h1 className="text-2xl font-bold mb-6 text-text-primary">Pénztár</h1>
          {!plan ? (
            <p className="text-text-secondary">Betöltés...</p>
          ) : (
            <div className="space-y-6">
              <div>
                <p className="text-text-secondary">Csomag</p>
                <p className="text-lg font-semibold text-text-primary">{plan.name}</p>
                <p className="text-sm text-text-secondary uppercase">{plan.gameType}</p>
              </div>
              <div>
                <p className="text-text-secondary">Számlázási ciklus</p>
                <p className="text-lg font-semibold text-text-primary">{billing === 'monthly' ? 'Havi' : 'Óránként'}</p>
              </div>
              <div className="flex items-baseline justify-between border-t pt-4 border-white/10">
                <span className="text-lg font-semibold text-text-primary">Fizetendő</span>
                <span className="text-2xl font-bold text-primary-400">{(currentPrice / 100).toLocaleString('hu-HU')} Ft</span>
              </div>

              <div className="flex gap-4">
                <Button onClick={placeOrder} disabled={loading} variant="primary" className="flex-1">
                  {loading ? 'Feldolgozás...' : 'Rendelés leadása'}
                </Button>
                <Button onClick={() => router.push(`/${locale}/plans/${planSlug}`)} variant="outline">Vissza</Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
