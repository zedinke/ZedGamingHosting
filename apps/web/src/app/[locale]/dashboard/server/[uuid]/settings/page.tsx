'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../../../../lib/api-client';
import { useAuthStore } from '../../../../../../stores/auth-store';
import { Card, Button } from '@zed-hosting/ui-kit';
import { Navigation } from '../../../../../../components/navigation';
import { ProtectedRoute } from '../../../../../../components/protected-route';

export default function ServerSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations();
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const serverUuid = params?.uuid as string;
  const locale = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] || 'hu' : 'hu';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [settings, setSettings] = useState({
    cpuLimit: 2,
    ramLimit: 2048,
    diskLimit: 20,
    startupPriority: 5,
  });

  useEffect(() => {
    if (accessToken) {
      apiClient.setAccessToken(accessToken);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!serverUuid) {
      router.push(`/${locale}/dashboard`);
    }
  }, [serverUuid, router, locale]);

  // Fetch server data
  const { data: server, isLoading } = useQuery({
    queryKey: ['server', serverUuid],
    queryFn: async () => {
      const response = await apiClient.get<any>(`/servers/${serverUuid}`);
      return response;
    },
    enabled: !!accessToken && !!serverUuid,
  });

  useEffect(() => {
    if (server?.resources) {
      setSettings({
        cpuLimit: server.resources.cpuLimit || 2,
        ramLimit: server.resources.ramLimit || 2048,
        diskLimit: server.resources.diskLimit || 20,
        startupPriority: server.startupPriority || 5,
      });
    }
  }, [server]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await apiClient.put(`/servers/${serverUuid}/settings`, settings);
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['server', serverUuid] });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Beállítások mentése sikertelen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <Navigation />
      <main className="min-h-screen" style={{ 
        backgroundColor: '#0a0a0a', 
        background: 'radial-gradient(at 0% 0%, rgba(14, 165, 233, 0.1) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(59, 130, 246, 0.1) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(14, 165, 233, 0.05) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(59, 130, 246, 0.05) 0px, transparent 50%), #0a0a0a',
        color: '#f8fafc',
        minHeight: '100vh'
      }}>
        <div className="container mx-auto px-4 py-8">
          <header className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2" style={{ color: '#f8fafc' }}>
                  {t('dashboard.server.settings.title', { defaultValue: 'Szerver Beállítások' })}
                </h1>
                <p style={{ color: '#cbd5e1' }}>
                  {t('dashboard.server.settings.description', { defaultValue: 'Szerver erőforrások és beállítások módosítása' })}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push(`/${locale}/dashboard/server/${serverUuid}`)}
              >
                Vissza
              </Button>
            </div>
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
                    CPU Limit (Magok) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="32"
                    value={settings.cpuLimit}
                    onChange={(e) => setSettings({ ...settings, cpuLimit: parseInt(e.target.value) || 1 })}
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
                    RAM Limit (MB) *
                  </label>
                  <input
                    type="number"
                    min="512"
                    step="512"
                    value={settings.ramLimit}
                    onChange={(e) => setSettings({ ...settings, ramLimit: parseInt(e.target.value) || 512 })}
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
                    Disk Limit (GB) *
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={settings.diskLimit}
                    onChange={(e) => setSettings({ ...settings, diskLimit: parseInt(e.target.value) || 5 })}
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
                    Indítási Prioritás (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={settings.startupPriority}
                    onChange={(e) => setSettings({ ...settings, startupPriority: parseInt(e.target.value) || 5 })}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--color-bg-card)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-main)',
                    }}
                  />
                  <p className="text-xs mt-1" style={{ color: '#cbd5e1' }}>
                    Magasabb szám = magasabb prioritás
                  </p>
                </div>

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
                    onClick={() => router.push(`/${locale}/dashboard/server/${serverUuid}`)}
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
    </ProtectedRoute>
  );
}
