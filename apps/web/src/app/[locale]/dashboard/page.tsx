'use client';

import { useTranslations } from 'next-intl';
import { useAuthStore } from '../../../stores/auth-store';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import { ServerCard } from '../../../components/server-card';
import { Button, Card } from '@zed-hosting/ui-kit';
import { GameServer } from '../../../types/server';
import { SkipLink } from '../../../components/accessibility';

export default function DashboardPage() {
  const t = useTranslations();
  const { isAuthenticated } = useAuthStore();

  // Set API client token from auth store
  const { accessToken } = useAuthStore();
  useEffect(() => {
    apiClient.setAccessToken(accessToken);
  }, [accessToken]);

  // Fetch servers
  const { data: servers, isLoading } = useQuery<GameServer[]>({
    queryKey: ['servers'],
    queryFn: async () => {
      // TODO: Replace with actual API endpoint when implemented
      // return apiClient.get<GameServer[]>('/servers');
      return [];
    },
    enabled: isAuthenticated,
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      const locale = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] || 'hu' : 'hu';
      window.location.href = `/${locale}/login`;
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <SkipLink href="#main-content">
        {t('accessibility.skipToContent', { defaultValue: 'Skip to main content' })}
      </SkipLink>
      <main id="main-content" className="min-h-screen bg-mesh" style={{ backgroundColor: 'var(--color-bg-app)', color: 'var(--color-text-main)' }}>
        <div className="container mx-auto px-4 py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-main)' }}>{t('dashboard.title')}</h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              {t('dashboard.servers.title')}
            </p>
          </header>

          {/* Metrics Cards - Modern Design */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="glass elevation-2 p-6">
              <h3 className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                {t('dashboard.metrics.totalServers')}
              </h3>
              <p className="text-3xl font-bold" style={{ color: 'var(--color-text-main)' }}>
                {servers?.length || 0}
              </p>
            </Card>
            <Card className="glass elevation-2 p-6">
              <h3 className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                {t('dashboard.metrics.activeServers')}
              </h3>
              <p className="text-3xl font-bold" style={{ color: 'var(--color-success)' }}>
                {servers?.filter((s) => s.status === 'RUNNING').length || 0}
              </p>
            </Card>
            <Card className="glass elevation-2 p-6">
              <h3 className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                {t('dashboard.metrics.totalPlayers')}
              </h3>
              <p className="text-3xl font-bold" style={{ color: 'var(--color-text-main)' }}>0</p>
            </Card>
            <Card className="glass elevation-2 p-6">
              <h3 className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                {t('dashboard.metrics.uptime')}
              </h3>
              <p className="text-3xl font-bold" style={{ color: 'var(--color-text-main)' }}>99.9%</p>
            </Card>
          </div>

          {/* Servers Section */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold" style={{ color: 'var(--color-text-main)' }}>
                {t('dashboard.servers.title')}
              </h2>
              <Button>{t('dashboard.servers.create')}</Button>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
              </div>
            ) : !servers || servers.length === 0 ? (
              <Card className="glass elevation-2 p-12 text-center">
                <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('dashboard.servers.empty')}
                </p>
                <Button>{t('dashboard.servers.create')}</Button>
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
