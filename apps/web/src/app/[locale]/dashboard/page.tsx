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

export default function DashboardPage() {
  const t = useTranslations();
  const router = useRouter();
  const { isAuthenticated, accessToken } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

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

  // Fetch servers
  const { data: servers, isLoading, refetch } = useQuery<GameServer[]>({
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
      <main id="main-content" className="min-h-screen" style={{ 
        backgroundColor: '#0a0a0a', 
        background: 'radial-gradient(at 0% 0%, rgba(14, 165, 233, 0.1) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(59, 130, 246, 0.1) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(14, 165, 233, 0.05) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(59, 130, 246, 0.05) 0px, transparent 50%), #0a0a0a',
        color: '#f8fafc',
        minHeight: '100vh'
      }}>
        <div className="container mx-auto px-4 py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#f8fafc' }}>{t('dashboard.title')}</h1>
            <p style={{ color: '#cbd5e1' }}>
              {t('dashboard.servers.title')}
            </p>
          </header>

          {/* Metrics Cards - Modern Design */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="glass elevation-2 p-6">
              <h3 className="text-sm mb-2" style={{ color: '#cbd5e1' }}>
                {t('dashboard.metrics.totalServers')}
              </h3>
              <p className="text-3xl font-bold" style={{ color: '#f8fafc' }}>
                {servers?.length || 0}
              </p>
            </Card>
            <Card className="glass elevation-2 p-6">
              <h3 className="text-sm mb-2" style={{ color: '#cbd5e1' }}>
                {t('dashboard.metrics.activeServers')}
              </h3>
              <p className="text-3xl font-bold" style={{ color: '#10b981' }}>
                {servers?.filter((s) => s.status === 'RUNNING').length || 0}
              </p>
            </Card>
            <Card className="glass elevation-2 p-6">
              <h3 className="text-sm mb-2" style={{ color: '#cbd5e1' }}>
                {t('dashboard.metrics.totalPlayers')}
              </h3>
              <p className="text-3xl font-bold" style={{ color: '#f8fafc' }}>0</p>
            </Card>
            <Card className="glass elevation-2 p-6">
              <h3 className="text-sm mb-2" style={{ color: '#cbd5e1' }}>
                {t('dashboard.metrics.uptime')}
              </h3>
              <p className="text-3xl font-bold" style={{ color: '#f8fafc' }}>99.9%</p>
            </Card>
          </div>

          {/* Servers Section */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold" style={{ color: '#f8fafc' }}>
                {t('dashboard.servers.title')}
              </h2>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {servers.map((server) => (
                  <ServerCard key={server.uuid} server={server} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
