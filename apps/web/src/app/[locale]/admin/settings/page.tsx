'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../../stores/auth-store';
import { Navigation } from '../../../../components/navigation';
import { Card, Button } from '@zed-hosting/ui-kit';
import { apiClient } from '../../../../lib/api-client';
import { useNotificationContext } from '../../../../context/notification-context';

export default function AdminSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations();
  const { user: currentUser, isAuthenticated, accessToken } = useAuthStore();
  const notifications = useNotificationContext();
  const locale = (params.locale as string) || 'hu';
  const [isHydrated, setIsHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [settings, setSettings] = useState({
    maintenanceMode: false,
    allowNewRegistrations: true,
    defaultUserRole: 'USER',
    maxServersPerUser: 10,
    maxRamPerUser: 16384, // MB
    maxDiskPerUser: 500, // GB
  });

  const { data: currentSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      return await apiClient.get('/admin/settings');
    },
    enabled: isHydrated && isAuthenticated && !!accessToken,
  });

  useEffect(() => {
    if (currentSettings) {
      setSettings(currentSettings);
    }
  }, [currentSettings]);

  useEffect(() => {
    setIsHydrated(true);
    if (accessToken) {
      apiClient.setAccessToken(accessToken);
    }
  }, [accessToken]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await apiClient.put('/admin/settings', settings);
      
      setSuccess(true);
      notifications.addNotification({
        type: 'success',
        title: 'Beállítások mentve',
        message: 'A rendszerbeállítások sikeresen frissítve.',
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      const errorMessage = err.message || 'Beállítások mentése sikertelen';
      setError(errorMessage);
      notifications.addNotification({
        type: 'error',
        title: 'Hiba',
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isHydrated || isLoadingSettings) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Betöltés...</p>
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
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#f8fafc' }}>Rendszerbeállítások</h1>
            <p style={{ color: '#cbd5e1' }}>
              Platform konfiguráció és beállítások
            </p>
          </header>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <Card className="glass elevation-2 p-6">
                <h2 className="text-xl font-semibold mb-4" style={{ color: '#f8fafc' }}>
                  Általános Beállítások
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium" style={{ color: '#f8fafc' }}>
                        Karbantartási mód
                      </label>
                      <p className="text-xs" style={{ color: '#cbd5e1' }}>
                        A karbantartási módban csak adminok férhetnek hozzá a rendszerhez
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                      className="w-5 h-5 rounded border-2"
                      style={{
                        borderColor: 'var(--color-border)',
                        backgroundColor: 'var(--color-bg-card)',
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium" style={{ color: '#f8fafc' }}>
                        Új regisztrációk engedélyezése
                      </label>
                      <p className="text-xs" style={{ color: '#cbd5e1' }}>
                        Engedélyezi az új felhasználók regisztrációját
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.allowNewRegistrations}
                      onChange={(e) => setSettings({ ...settings, allowNewRegistrations: e.target.checked })}
                      className="w-5 h-5 rounded border-2"
                      style={{
                        borderColor: 'var(--color-border)',
                        backgroundColor: 'var(--color-bg-card)',
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#f8fafc' }}>
                      Alapértelmezett felhasználói szerepkör
                    </label>
                    <select
                      value={settings.defaultUserRole}
                      onChange={(e) => setSettings({ ...settings, defaultUserRole: e.target.value })}
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
                    </select>
                  </div>
                </div>
              </Card>

              <Card className="glass elevation-2 p-6">
                <h2 className="text-xl font-semibold mb-4" style={{ color: '#f8fafc' }}>
                  Felhasználói Korlátok
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#f8fafc' }}>
                      Max. szerverek felhasználónként
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={settings.maxServersPerUser}
                      onChange={(e) => setSettings({ ...settings, maxServersPerUser: parseInt(e.target.value) || 1 })}
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
                      Max. RAM felhasználónként (MB)
                    </label>
                    <input
                      type="number"
                      min="1024"
                      step="1024"
                      value={settings.maxRamPerUser}
                      onChange={(e) => setSettings({ ...settings, maxRamPerUser: parseInt(e.target.value) || 1024 })}
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
                      Max. Lemez felhasználónként (GB)
                    </label>
                    <input
                      type="number"
                      min="10"
                      step="10"
                      value={settings.maxDiskPerUser}
                      onChange={(e) => setSettings({ ...settings, maxDiskPerUser: parseInt(e.target.value) || 10 })}
                      className="w-full px-4 py-2 rounded-lg border"
                      style={{
                        backgroundColor: 'var(--color-bg-card)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-main)',
                      }}
                    />
                  </div>
                </div>
              </Card>

              {error && (
                <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-4 rounded-lg bg-green-500/20 border border-green-500/50 text-green-400">
                  Beállítások sikeresen mentve!
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Mentés...' : 'Beállítások Mentése'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/${locale}/admin`)}
                  disabled={loading}
                >
                  Mégse
                </Button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}

