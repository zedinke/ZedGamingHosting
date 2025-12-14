'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '../../../../../../stores/auth-store';
import { Navigation } from '../../../../../../components/navigation';
import { Card, Button } from '@zed-hosting/ui-kit';
import { apiClient } from '../../../../../../lib/api-client';
import { useQuery } from '@tanstack/react-query';

interface User {
  id: string;
  email: string;
  balance: number;
}

export default function UserBalancePage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'hu';
  const userId = params?.id as string;
  const { user: currentUser, isAuthenticated, accessToken } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    amount: 0,
    type: 'add' as 'add' | 'subtract' | 'set',
    reason: '',
  });

  useEffect(() => {
    setIsHydrated(true);
    if (accessToken) {
      apiClient.setAccessToken(accessToken);
    }
  }, [accessToken]);

  useEffect(() => {
    if (isHydrated && !userId) {
      router.push(`/${locale}/admin/users`);
    }
  }, [isHydrated, userId, router, locale]);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }

    const userRole = currentUser?.role?.toUpperCase();
    if (isHydrated && isAuthenticated && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'SUPERADMIN' && userRole !== 'RESELLER_ADMIN') {
      router.push(`/${locale}/dashboard`);
      return;
    }
  }, [isAuthenticated, isHydrated, currentUser, router, locale]);

  const { data: userData, isLoading } = useQuery<User>({
    queryKey: ['admin-user', userId],
    queryFn: async () => {
      if (!userId) return null as any;
      return await apiClient.get<User>(`/admin/users/${userId}`);
    },
    enabled: isHydrated && isAuthenticated && !!accessToken && !!userId,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (formData.amount <= 0) {
      setError('Az összegnek nagyobbnak kell lennie, mint 0');
      setLoading(false);
      return;
    }

    try {
      await apiClient.post(`/admin/users/${userId}/balance`, {
        amount: formData.amount,
        type: formData.type,
        reason: formData.reason,
      });
      
      notifications.addNotification({
        type: 'success',
        title: 'Egyenleg módosítva',
        message: `A felhasználó egyenlege sikeresen módosítva (${formData.type}: ${formData.amount} €)`,
      });
      
      setSuccess(true);
      setFormData({ amount: 0, type: 'add', reason: '' });
      setTimeout(() => {
        router.push(`/${locale}/admin/users/${userId}`);
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.message || 'Egyenleg módosítása sikertelen';
      setError(errorMessage);
      notifications.addNotification({
        type: 'error',
        title: 'Hiba',
        message: errorMessage,
      });
      setLoading(false);
    }
  };

  if (!isHydrated) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  const userRole = currentUser?.role?.toUpperCase();
  if (!isAuthenticated || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'SUPERADMIN' && userRole !== 'RESELLER_ADMIN')) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Redirecting...</p>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen" style={{ 
        backgroundColor: '#0a0a0a', 
        background: 'radial-gradient(at 0% 0%, rgba(14, 165, 233, 0.1) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(59, 130, 246, 0.1) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(14, 165, 233, 0.05) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(59, 130, 246, 0.05) 0px, transparent 50%), #0a0a0a',
        color: '#f8fafc',
        minHeight: '100vh'
      }}>
        <div className="container mx-auto px-4 py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#f8fafc' }}>Egyenleg Módosítása</h1>
            <p style={{ color: '#cbd5e1' }}>
              {userData?.email || 'Felhasználó'} egyenlegének módosítása
            </p>
          </header>

          {isLoading ? (
            <div className="text-center py-12">
              <p style={{ color: '#cbd5e1' }}>Betöltés...</p>
            </div>
          ) : (
            <Card className="glass elevation-2 p-6 max-w-2xl mx-auto">
              {userData && (
                <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-surface)' }}>
                  <p className="text-sm" style={{ color: '#cbd5e1' }}>Jelenlegi egyenleg:</p>
                  <p className="text-2xl font-bold" style={{ color: '#f8fafc' }}>
                    {userData.balance.toFixed(2)} €
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8fafc' }}>
                    Művelet típusa *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'add' | 'subtract' | 'set' })}
                    required
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--color-bg-card)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-main)',
                    }}
                  >
                    <option value="add">Hozzáadás</option>
                    <option value="subtract">Levonás</option>
                    <option value="set">Beállítás</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8fafc' }}>
                    Összeg (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--color-bg-card)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-main)',
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8fafc' }}>
                    Indoklás
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--color-bg-card)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-main)',
                    }}
                  />
                </div>

                {error && (
                  <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-4 rounded-lg bg-green-500/20 border border-green-500/50 text-green-400">
                    Egyenleg sikeresen módosítva! Átirányítás...
                  </div>
                )}

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? 'Mentés...' : 'Mentés'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/${locale}/admin/users/${userId}`)}
                    disabled={loading}
                  >
                    Mégse
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}

