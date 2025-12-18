"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, Button } from '@zed-hosting/ui-kit';
import { Navigation } from '../../../../components/navigation';
import { useAuthStore } from '../../../../stores/auth-store';
import { apiClient } from '../../../../lib/api-client';
import { useNotificationContext } from '../../../../context/notification-context';

interface BalanceDto {
  id: string;
  email: string;
  balance: number;
}

export default function WalletPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'hu';
  const { isAuthenticated, accessToken } = useAuthStore();
  const notifications = useNotificationContext();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<BalanceDto | null>(null);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);

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
        const data = await apiClient.get<BalanceDto>(`/wallet`);
        setBalance(data);
      } catch (e: any) {
        notifications.addNotification({
          type: 'error',
          title: 'Hiba',
          message: e?.message || 'Nem sikerült betölteni az egyenleget.',
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated, locale, notifications, router]);

  const formatHuf = (amount: number) => `${(amount / 100).toLocaleString('hu-HU')} Ft`;

  const handleTopup = async () => {
    const amount = parseInt(topupAmount, 10) * 100; // Convert to cents
    if (!amount || amount <= 0) {
      notifications.addNotification({
        type: 'error',
        title: 'Hiba',
        message: 'Kérjük, adjon meg érvényes összeget.',
      });
      return;
    }

    setTopupLoading(true);
    try {
      // Stub: redirect to payment
      notifications.addNotification({
        type: 'info',
        title: 'Fizetés átirányítása',
        message: 'Ön a fizetési oldalra lesz irányítva.',
      });
      // In production: initiate payment gateway
    } catch (e: any) {
      notifications.addNotification({
        type: 'error',
        title: 'Hiba',
        message: e?.message || 'Töltés sikertelen.',
      });
    } finally {
      setTopupLoading(false);
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

  return (
    <>
      <Navigation />
      <div className="min-h-screen" style={{ backgroundColor: '#0a0a0a', color: '#f8fafc' }}>
        <div className="container mx-auto max-w-2xl px-4 py-8">
          <div className="mb-6">
            <Link href={`/${locale}/profile`} className="text-sm text-primary-400 hover:text-primary-300 transition">
              ← Vissza a profilhoz
            </Link>
            <h1 className="text-3xl font-bold mt-2">Pénztárca</h1>
          </div>

          {/* Balance Display */}
          <Card className="p-8 bg-gradient-to-r from-primary-900/20 to-primary-800/20 border border-primary-700/30 mb-6">
            <p className="text-text-secondary mb-2 text-sm uppercase tracking-wider">Jelenlegi egyenleg</p>
            <p className="text-5xl font-bold text-primary-400">{balance && formatHuf(balance.balance)}</p>
          </Card>

          {/* Topup Section */}
          <Card className="p-6 bg-background-surface text-text-primary mb-6">
            <h2 className="text-xl font-bold mb-4">Egyenleg feltöltése</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Összeg (Ft)</label>
                <input
                  type="number"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  placeholder="pl. 5000"
                  min="100"
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-main)',
                  }}
                />
              </div>
              <div className="flex gap-2">
                {[1000, 5000, 10000].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setTopupAmount(preset.toString())}
                    className="flex-1 px-4 py-2 rounded-lg border text-sm transition-colors"
                    style={{
                      backgroundColor: 'var(--color-bg-elevated)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-main)',
                    }}
                  >
                    +{preset.toLocaleString('hu-HU')} Ft
                  </button>
                ))}
              </div>
              <Button
                onClick={handleTopup}
                disabled={topupLoading || !topupAmount}
                variant="primary"
                className="w-full"
              >
                {topupLoading ? 'Feldolgozás...' : 'Feltöltés és fizetés'}
              </Button>
            </div>
          </Card>

          {/* Info */}
          <Card className="p-4 bg-info-900/20 border border-info-700/30">
            <p className="text-sm text-text-secondary">
              Az egyenlege rendelésekhez, kiegészítő erőforrásokhoz és egyéb szolgáltatásokhoz használható fel.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
