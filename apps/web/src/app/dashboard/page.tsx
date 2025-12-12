'use client';

import { useTranslations } from 'next-intl';
import { useAuthStore } from '../../stores/auth-store';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { ServerCard } from '../../components/server-card';
import { Button } from '@zed-hosting/ui-kit';

interface GameServer {
  uuid: string;
  name: string;
  gameType: string;
  status: 'ONLINE' | 'OFFLINE' | 'STARTING' | 'STOPPING' | 'RESTARTING';
  nodeId: string;
  cpuUsage?: number;
  ramUsage?: number;
  diskUsage?: number;
}

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
      window.location.href = '/login';
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{t('dashboard.title')}</h1>
          <p className="text-gray-400">
            {t('dashboard.servers.title')}
          </p>
        </header>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/60 backdrop-blur-xl rounded-lg p-6 border border-white/10">
            <h3 className="text-sm text-gray-400 mb-2">
              {t('dashboard.metrics.totalServers')}
            </h3>
            <p className="text-3xl font-bold">
              {servers?.length || 0}
            </p>
          </div>
          <div className="bg-gray-800/60 backdrop-blur-xl rounded-lg p-6 border border-white/10">
            <h3 className="text-sm text-gray-400 mb-2">
              {t('dashboard.metrics.activeServers')}
            </h3>
            <p className="text-3xl font-bold text-green-400">
              {servers?.filter((s) => s.status === 'ONLINE').length || 0}
            </p>
          </div>
          <div className="bg-gray-800/60 backdrop-blur-xl rounded-lg p-6 border border-white/10">
            <h3 className="text-sm text-gray-400 mb-2">
              {t('dashboard.metrics.totalPlayers')}
            </h3>
            <p className="text-3xl font-bold">0</p>
          </div>
          <div className="bg-gray-800/60 backdrop-blur-xl rounded-lg p-6 border border-white/10">
            <h3 className="text-sm text-gray-400 mb-2">
              {t('dashboard.metrics.uptime')}
            </h3>
            <p className="text-3xl font-bold">99.9%</p>
          </div>
        </div>

        {/* Servers Section */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">
              {t('dashboard.servers.title')}
            </h2>
            <Button>{t('dashboard.servers.create')}</Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Loading...</p>
            </div>
          ) : !servers || servers.length === 0 ? (
            <div className="bg-gray-800/60 backdrop-blur-xl rounded-lg p-12 border border-white/10 text-center">
              <p className="text-gray-400 mb-4">
                {t('dashboard.servers.empty')}
              </p>
              <Button>{t('dashboard.servers.create')}</Button>
            </div>
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
  );
}

