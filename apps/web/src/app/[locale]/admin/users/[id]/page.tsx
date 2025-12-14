'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '../../../../../stores/auth-store';
import { Navigation } from '../../../../../components/navigation';
import { Card, Button } from '@zed-hosting/ui-kit';
import { apiClient } from '../../../../../lib/api-client';
import { useQuery } from '@tanstack/react-query';

interface User {
  id: string;
  email: string;
  role: string;
  balance: number;
  createdAt: string;
  tenantId?: string;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'hu';
  const userId = params?.id as string;
  const { user: currentUser, isAuthenticated, accessToken } = useAuthStore();
  const notifications = useNotificationContext();
  const [isHydrated, setIsHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    role: 'USER',
    balance: 0,
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

  // Note: This endpoint doesn't exist yet
  const { data: userData, isLoading } = useQuery<User>({
    queryKey: ['admin-user', userId],
    queryFn: async () => {
      if (!userId) return null as any;
      return await apiClient.get<User>(`/admin/users/${userId}`);
    },
    enabled: isHydrated && isAuthenticated && !!accessToken && !!userId,
  });

  useEffect(() => {
    if (userData) {
      setFormData({
        email: userData.email,
        role: userData.role,
        balance: userData.balance,
      });
    }
  }, [userData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiClient.put(`/admin/users/${userId}`, formData);
      
      notifications.addNotification({
        type: 'success',
        title: 'Felhasználó frissítve',
        message: 'A felhasználó adatai sikeresen frissítve.',
      });
      
      router.push(`/${locale}/admin/users`);
    } catch (err: any) {
      const errorMessage = err.message || 'Felhasználó frissítése sikertelen';
      setError(errorMessage);
      notifications.addNotification({
        type: 'error',
        title: 'Hiba',
        message: errorMessage,
      });
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiClient.delete(`/admin/users/${userId}`);
      
      notifications.addNotification({
        type: 'success',
        title: 'Felhasználó törölve',
        message: 'A felhasználó sikeresen törölve.',
      });
      
      router.push(`/${locale}/admin/users`);
    } catch (err: any) {
      const errorMessage = err.message || 'Felhasználó törlése sikertelen';
      setError(errorMessage);
      notifications.addNotification({
        type: 'error',
        title: 'Hiba',
        message: errorMessage,
      });
      setLoading(false);
      setDeleteConfirm(false);
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
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#f8fafc' }}>Felhasználó Szerkesztése</h1>
            <p style={{ color: '#cbd5e1' }}>
              Felhasználói adatok módosítása
            </p>
          </header>

          {isLoading ? (
            <div className="text-center py-12">
              <p style={{ color: '#cbd5e1' }}>Betöltés...</p>
            </div>
          ) : (
            <Card className="glass elevation-2 p-6 max-w-2xl mx-auto">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8fafc' }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                    Szerepkör *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    required
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--color-bg-card)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-main)',
                    }}
                  >
                    <option value="USER">USER</option>
                    <option value="SUPPORT">SUPPORT</option>
                    <option value="RESELLER_ADMIN">RESELLER_ADMIN</option>
                    <option value="SUPERADMIN">SUPERADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8fafc' }}>
                    Egyenleg (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
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

                <div className="space-y-4">
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
                      onClick={() => router.push(`/${locale}/admin/users`)}
                      disabled={loading}
                    >
                      Mégse
                    </Button>
                  </div>
                  
                  <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push(`/${locale}/admin/users/${userId}/balance`)}
                        disabled={loading}
                        className="flex-1"
                      >
                        Egyenleg módosítása
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleDelete}
                        disabled={loading}
                        style={{ 
                          backgroundColor: deleteConfirm ? '#ef4444' : undefined,
                          color: deleteConfirm ? '#fff' : undefined
                        }}
                        className="flex-1"
                      >
                        {deleteConfirm ? 'Biztosan törlöd?' : 'Törlés'}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}

