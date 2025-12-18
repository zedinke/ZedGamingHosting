'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../../stores/auth-store';
import { AdminLayout } from '../../../../components/admin/admin-layout';
import { Card, Button, Input } from '@zed-hosting/ui-kit';
import { apiClient } from '../../../../lib/api-client';
import { useNotificationContext } from '../../../../context/notification-context';
import { BackButton } from '../../../../components/back-button';

export default function AdminSettingsPage() {
  const router = useRouter();
  const params = useParams();
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

  interface SettingsData {
    maintenanceMode?: boolean;
    allowNewRegistrations?: boolean;
    defaultUserRole?: string;
    maxServersPerUser?: number;
    maxRamPerUser?: number;
    maxDiskPerUser?: number;
  }

  const { data: currentSettings, isLoading: isLoadingSettings } = useQuery<SettingsData>({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      return await apiClient.get<SettingsData>('/admin/settings');
    },
    enabled: isHydrated && isAuthenticated && !!accessToken,
  });

  useEffect(() => {
    if (currentSettings) {
      setSettings({
        maintenanceMode: currentSettings.maintenanceMode ?? false,
        allowNewRegistrations: currentSettings.allowNewRegistrations ?? true,
        defaultUserRole: currentSettings.defaultUserRole ?? 'USER',
        maxServersPerUser: currentSettings.maxServersPerUser ?? 10,
        maxRamPerUser: currentSettings.maxRamPerUser ?? 16384,
        maxDiskPerUser: currentSettings.maxDiskPerUser ?? 500,
      });
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
      <div className="min-h-screen flex items-center justify-center bg-background-surface">
        <p className="text-text-muted">Betöltés...</p>
      </div>
    );
  }

  const userRole = currentUser?.role?.toUpperCase();
  if (!isAuthenticated || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'SUPERADMIN' && userRole !== 'RESELLER_ADMIN')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-surface">
        <p className="text-text-muted">Átirányítás...</p>
      </div>
    );
  }

  return (
    <div>
      <AdminLayout title="Rendszerbeállítások">
        <div>
          <div className="mb-4 flex justify-end">
            <BackButton fallbackHref={`/${locale}/admin`} />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-text-main">
                  Általános Beállítások
                </h2>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-text-main">
                        Karbantartási mód
                      </label>
                      <p className="text-xs text-text-muted">
                        A karbantartási módban csak adminok férhetnek hozzá a rendszerhez
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                      className="w-5 h-5 rounded border-2 border-border bg-background-card"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-text-main">
                        Új regisztrációk engedélyezése
                      </label>
                      <p className="text-xs text-text-muted">
                        Engedélyezi az új felhasználók regisztrációját
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.allowNewRegistrations}
                      onChange={(e) => setSettings({ ...settings, allowNewRegistrations: e.target.checked })}
                      className="w-5 h-5 rounded border-2 border-border bg-background-card"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-text-main">
                      Alapértelmezett felhasználói szerepkör
                    </label>
                    <select
                      value={settings.defaultUserRole}
                      onChange={(e) => setSettings({ ...settings, defaultUserRole: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-border text-sm bg-background-card text-text-main"
                    >
                      <option value="USER">USER</option>
                      <option value="SUPPORT">SUPPORT</option>
                      <option value="SUPPORTER">SUPPORTER</option>
                      <option value="RESELLER_ADMIN">RESELLER_ADMIN</option>
                    </select>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-text-main">
                  Felhasználói Korlátok
                </h2>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-text-main">
                      Max. szerverek felhasználónként
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={settings.maxServersPerUser}
                      onChange={(e) => setSettings({ ...settings, maxServersPerUser: parseInt(e.target.value) || 1 })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-text-main">
                      Max. RAM felhasználónként (MB)
                    </label>
                    <Input
                      type="number"
                      min="1024"
                      step="1024"
                      value={settings.maxRamPerUser}
                      onChange={(e) => setSettings({ ...settings, maxRamPerUser: parseInt(e.target.value) || 1024 })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-text-main">
                      Max. Lemez felhasználónként (GB)
                    </label>
                    <Input
                      type="number"
                      min="10"
                      step="10"
                      value={settings.maxDiskPerUser}
                      onChange={(e) => setSettings({ ...settings, maxDiskPerUser: parseInt(e.target.value) || 10 })}
                    />
                  </div>
                </div>
              </Card>

              {error && (
                <div className="p-4 rounded-lg border border-danger bg-danger/10 text-danger">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-4 rounded-lg border border-success bg-success/10 text-success">
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
      </AdminLayout>
    </div>
  );
}

