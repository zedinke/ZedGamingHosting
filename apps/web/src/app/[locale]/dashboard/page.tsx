'use client';

import { useTranslations } from 'next-intl';
import { useAuthStore } from '../../../stores/auth-store';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import { ServerCard } from '../../../components/server-card';
import { Button } from '@zed-hosting/ui-kit';
import { Card, CardContent } from '@zed-hosting/ui-kit';
import { GameServer } from '../../../types/server';
import { ProtectedRoute } from '../../../components/protected-route';
import { Navigation } from '../../../components/navigation';
import { useRouter } from 'next/navigation';
import { cn } from '../../../lib/utils';

function DashboardContent() {
  const t = useTranslations();
  const router = useRouter();
  const locale = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] || 'hu' : 'hu';
  
  const { accessToken } = useAuthStore();
  useEffect(() => {
    apiClient.setAccessToken(accessToken);
  }, [accessToken]);

  const { data: servers, isLoading } = useQuery<GameServer[]>({
    queryKey: ['servers'],
    queryFn: async () => {
      try {
        const response = await apiClient.get<any[]>('/servers');
        return response.map((server: any) => ({
          uuid: server.uuid,
          id: server.id,
          gameType: server.gameType,
          status: server.status,
          nodeId: server.nodeId,
          ownerId: server.ownerId,
          startupPriority: server.startupPriority,
          resources: server.resources || { cpuLimit: 0, ramLimit: 0, diskLimit: 0 },
          envVars: server.envVars || {},
          clusterId: server.clusterId,
          createdAt: new Date(server.createdAt),
          updatedAt: new Date(server.updatedAt),
          name: server.name || server.gameType || 'Server',
          node: server.node,
          ports: server.networkAllocations || [],
          metrics: server.metrics?.[0] || null,
        }));
      } catch (error) {
        console.error('Failed to fetch servers:', error);
        return [];
      }
    },
    enabled: true,
    refetchInterval: 30000,
  });

  const totalServers = servers?.length || 0;
  const activeServers = servers?.filter((s) => s.status === 'RUNNING').length || 0;

  return (
    <ProtectedRoute>
      <div 
        className="min-h-screen"
        style={{ backgroundColor: 'var(--color-bg-app)' }}
      >
        <Navigation />
        
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 
                className="text-3xl font-bold mb-2"
                style={{ color: 'var(--color-text-main)' }}
              >
                {t('dashboard.title')}
              </h1>
              <p 
                className="text-sm"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {t('dashboard.servers.title')}
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => router.push(`/${locale}/dashboard/create`)}
            >
              {t('dashboard.servers.create')}
            </Button>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="border-[var(--color-border)] bg-[var(--color-bg-card)]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p 
                      className="text-sm font-medium mb-1"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {t('dashboard.metrics.totalServers')}
                    </p>
                    <p 
                      className="text-3xl font-bold"
                      style={{ color: 'var(--color-text-main)' }}
                    >
                      {totalServers}
                    </p>
                  </div>
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-primary)/10' }}
                  >
                    <svg className="w-6 h-6" style={{ color: 'var(--color-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[var(--color-border)] bg-[var(--color-bg-card)]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p 
                      className="text-sm font-medium mb-1"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {t('dashboard.metrics.activeServers')}
                    </p>
                    <p 
                      className="text-3xl font-bold"
                      style={{ color: 'var(--color-success)' }}
                    >
                      {activeServers}
                    </p>
                  </div>
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
                  >
                    <svg className="w-6 h-6" style={{ color: 'var(--color-success)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[var(--color-border)] bg-[var(--color-bg-card)]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p 
                      className="text-sm font-medium mb-1"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {t('dashboard.metrics.totalPlayers')}
                    </p>
                    <p 
                      className="text-3xl font-bold"
                      style={{ color: 'var(--color-text-main)' }}
                    >
                      0
                    </p>
                  </div>
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-primary)/10' }}
                  >
                    <svg className="w-6 h-6" style={{ color: 'var(--color-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[var(--color-border)] bg-[var(--color-bg-card)]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p 
                      className="text-sm font-medium mb-1"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {t('dashboard.metrics.uptime')}
                    </p>
                    <p 
                      className="text-3xl font-bold"
                      style={{ color: 'var(--color-success)' }}
                    >
                      99.9%
                    </p>
                  </div>
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
                  >
                    <svg className="w-6 h-6" style={{ color: 'var(--color-success)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Servers Section */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 
                className="text-xl font-semibold"
                style={{ color: 'var(--color-text-main)' }}
              >
                {t('dashboard.servers.title')}
              </h2>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
                <p 
                  className="mt-4 text-sm"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {t('dashboard.loadingServers') || 'Loading servers...'}
                </p>
              </div>
            ) : !servers || servers.length === 0 ? (
              <Card className="border-[var(--color-border)] bg-[var(--color-bg-card)]">
                <CardContent className="p-12 text-center">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: 'var(--color-bg-elevated)' }}
                  >
                    <svg className="w-8 h-8" style={{ color: 'var(--color-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p 
                    className="mb-6"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {t('dashboard.servers.empty')}
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => router.push(`/${locale}/dashboard/create`)}
                  >
                    {t('dashboard.servers.create')}
                  </Button>
                </CardContent>
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
      </div>
    </ProtectedRoute>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}
