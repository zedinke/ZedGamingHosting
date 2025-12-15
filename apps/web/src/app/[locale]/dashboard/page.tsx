'use client';

import { useTranslations } from 'next-intl';
import { useAuthStore } from '../../../stores/auth-store';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import { ServerCard } from '../../../components/server-card';
import { Button, Card } from '@zed-hosting/ui-kit';
import { GameServer } from '../../../types/server';
import { SkipLink } from '../../../components/accessibility';
import { useRouter } from 'next/navigation';
import { Navigation } from '../../../components/navigation';
import { ToastContainer } from '../../../components/toast-container';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotificationContext } from '../../../context/notification-context';

export default function DashboardPage() {
  const t = useTranslations();
  const router = useRouter();
  const { isAuthenticated, accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const notifications = useNotificationContext();
  const [isHydrated, setIsHydrated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Wait for hydration to avoid hydration mismatch
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Set API client token from auth store
  useEffect(() => {
    if (accessToken) {
      apiClient.setAccessToken(accessToken);
    }
  }, [accessToken]);

  // Server actions mutations
  const startServerMutation = useMutation({
    mutationFn: async (uuid: string) => {
      return await apiClient.post(`/servers/${uuid}/start`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      notifications.addNotification({
        type: 'success',
        title: 'Szerver indítva',
        message: 'A szerver sikeresen elindult.',
      });
    },
    onError: (err: any) => {
      notifications.addNotification({
        type: 'error',
        title: 'Hiba',
        message: err.message || 'A szerver indítása sikertelen volt.',
      });
    },
  });

  const stopServerMutation = useMutation({
    mutationFn: async (uuid: string) => {
      return await apiClient.post(`/servers/${uuid}/stop`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      notifications.addNotification({
        type: 'success',
        title: 'Szerver leállítva',
        message: 'A szerver sikeresen leállítva.',
      });
    },
    onError: (err: any) => {
      notifications.addNotification({
        type: 'error',
        title: 'Hiba',
        message: err.message || 'A szerver leállítása sikertelen volt.',
      });
    },
  });

  const restartServerMutation = useMutation({
    mutationFn: async (uuid: string) => {
      return await apiClient.post(`/servers/${uuid}/restart`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      notifications.addNotification({
        type: 'success',
        title: 'Szerver újraindítva',
        message: 'A szerver sikeresen újraindult.',
      });
    },
    onError: (err: any) => {
      notifications.addNotification({
        type: 'error',
        title: 'Hiba',
        message: err.message || 'A szerver újraindítása sikertelen volt.',
      });
    },
  });

  const deleteServerMutation = useMutation({
    mutationFn: async (uuid: string) => {
      return await apiClient.delete(`/servers/${uuid}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      notifications.addNotification({
        type: 'success',
        title: 'Szerver törölve',
        message: 'A szerver sikeresen törölve.',
      });
    },
    onError: (err: any) => {
      notifications.addNotification({
        type: 'error',
        title: 'Hiba',
        message: err.message || 'A szerver törlése sikertelen volt.',
      });
    },
  });

  // Fetch servers
  const { data: servers, isLoading } = useQuery<GameServer[]>({
    queryKey: ['servers'],
    queryFn: async () => {
      try {
        const response = await apiClient.get<any[]>('/servers');
        // Transform API response to GameServer format
        return response.map((server: any) => ({
          id: server.id,
          uuid: server.uuid,
          gameType: server.gameType,
          status: server.status,
          nodeId: server.nodeId,
          ownerId: server.ownerId,
          startupPriority: server.startupPriority,
          resources: server.resources || {},
          envVars: server.envVars || {},
          clusterId: server.clusterId,
          createdAt: new Date(server.createdAt),
          updatedAt: new Date(server.updatedAt),
          node: server.node,
          ports: server.networkAllocations || [],
          metrics: server.metrics?.[0] || {},
        }));
      } catch (error) {
        console.error('Failed to fetch servers:', error);
        return [];
      }
    },
    enabled: isAuthenticated && isHydrated && !!accessToken,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Filter servers based on search query
  const filteredServers = servers?.filter((server) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      server.gameType.toLowerCase().includes(query) ||
      server.uuid.toLowerCase().includes(query) ||
      (server.name && server.name.toLowerCase().includes(query))
    );
  });

  // Redirect to login if not authenticated (after hydration)
  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      const locale = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] || 'hu' : 'hu';
      router.push(`/${locale}/login`);
    }
  }, [isAuthenticated, isHydrated, router]);

  // Show loading state during hydration
  if (!isHydrated) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>{t('dashboard.loading', { defaultValue: 'Loading...' })}</p>
      </div>
    );
  }

  // Show redirect message if not authenticated
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>{t('dashboard.loading', { defaultValue: 'Redirecting to login...' })}</p>
      </div>
    );
  }

  return (
    <>
      <SkipLink href="#main-content">
        {t('accessibility.skipToContent', { defaultValue: 'Skip to main content' })}
      </SkipLink>
      <Navigation />
      <ToastContainer />
      <main id="main-content" className="min-h-screen bg-mesh text-text-primary">
        <div className="container mx-auto px-4 py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-2 text-text-primary">{t('dashboard.title')}</h1>
            <p className="text-text-secondary">
              {t('dashboard.servers.title')}
            </p>
          </header>

          {/* Metrics Cards - Modern Design */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-6">
              <h3 className="text-sm mb-2 text-text-secondary">
                {t('dashboard.metrics.totalServers')}
              </h3>
              <p className="text-3xl font-bold text-text-primary">
                {servers?.length || 0}
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-sm mb-2 text-text-secondary">
                {t('dashboard.metrics.activeServers')}
              </h3>
              <p className="text-3xl font-bold text-success-500">
                {servers?.filter((s) => s.status === 'RUNNING').length || 0}
              </p>
            </Card>
                <Card className="p-6">
                  <h3 className="text-sm mb-2 text-text-secondary">
                    {t('dashboard.metrics.totalPlayers')}
                  </h3>
                  <p className="text-3xl font-bold text-text-primary">
                    {servers?.reduce((sum, s) => sum + (s.metrics?.players || 0), 0) || 0}
                  </p>
                </Card>
                <Card className="p-6">
                  <h3 className="text-sm mb-2 text-text-secondary">
                    {t('dashboard.metrics.uptime')}
                  </h3>
                  <p className="text-3xl font-bold text-text-primary">
                    {servers && servers.length > 0
                      ? ((servers.filter((s) => s.status === 'RUNNING').length / servers.length) * 100).toFixed(1)
                      : '0'}%
                  </p>
                </Card>
          </div>

          {/* Servers Section */}
          <section>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4 text-text-primary">
                  {t('dashboard.servers.title')}
                </h2>
                <input
                  type="text"
                  placeholder="Szerverek keresése..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-64 px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-main)',
                  }}
                />
              </div>
              <Button onClick={() => {
                const locale = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] || 'hu' : 'hu';
                router.push(`/${locale}/dashboard/create`);
              }}>
                {t('dashboard.servers.create')}
              </Button>
            </div>

                  {isLoading ? (
                    <div className="text-center py-12">
                      <p style={{ color: '#cbd5e1' }}>Loading...</p>
                    </div>
                  ) : !servers || servers.length === 0 ? (
                    <Card className="glass elevation-2 p-12 text-center">
                      <p className="mb-4" style={{ color: '#cbd5e1' }}>
                        {t('dashboard.servers.empty')}
                      </p>
                      <Button onClick={() => {
                        const locale = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] || 'hu' : 'hu';
                        router.push(`/${locale}/dashboard/create`);
                      }}>
                        {t('dashboard.servers.create')}
                      </Button>
                    </Card>
                  ) : (
                    <>
                      {filteredServers && filteredServers.length === 0 ? (
                        <Card className="glass elevation-2 p-12 text-center">
                          <p style={{ color: '#cbd5e1' }}>
                            {searchQuery ? 'Nincs találat a keresésre' : 'Nincs szerver'}
                          </p>
                        </Card>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {filteredServers?.map((server) => {
                            const locale = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] || 'hu' : 'hu';
                            return (
                              <ServerCard
                                key={server.uuid}
                                server={server}
                                locale={locale}
                                onStart={(uuid) => startServerMutation.mutate(uuid)}
                                onStop={(uuid) => stopServerMutation.mutate(uuid)}
                                onRestart={(uuid) => restartServerMutation.mutate(uuid)}
                                onDelete={(uuid) => {
                                  if (window.confirm('Biztosan törölni szeretnéd ezt a szervert? Ez a művelet visszavonhatatlan.')) {
                                    deleteServerMutation.mutate(uuid);
                                  }
                                }}
                              />
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Quick Actions */}
                  {servers && servers.length > 0 && (
                    <div className="mt-8">
                      <h2 className="text-2xl font-semibold mb-4" style={{ color: '#f8fafc' }}>
                        Gyors műveletek
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="glass elevation-2 p-6 cursor-pointer hover:scale-105 transition-transform" onClick={() => {
                          const locale = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] || 'hu' : 'hu';
                          router.push(`/${locale}/dashboard/create`);
                        }}>
                          <h3 className="text-lg font-semibold mb-2" style={{ color: '#f8fafc' }}>
                            Új szerver létrehozása
                          </h3>
                          <p className="text-sm" style={{ color: '#cbd5e1' }}>
                            Hozz létre egy új játék szervert
                          </p>
                        </Card>
                        <Card className="glass elevation-2 p-6">
                          <h3 className="text-lg font-semibold mb-2" style={{ color: '#f8fafc' }}>
                            Szerverek kezelése
                          </h3>
                          <p className="text-sm" style={{ color: '#cbd5e1' }}>
                            Összes szerver áttekintése
                          </p>
                        </Card>
                        <Card className="glass elevation-2 p-6">
                          <h3 className="text-lg font-semibold mb-2" style={{ color: '#f8fafc' }}>
                            Dokumentáció
                          </h3>
                          <p className="text-sm" style={{ color: '#cbd5e1' }}>
                            Használati útmutató és segítség
                          </p>
                        </Card>
                      </div>
                    </div>
                  )}
          </section>
        </div>
      </main>
    </>
  );
}
