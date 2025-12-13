'use client';

import { useTranslations } from 'next-intl';
import { Button, Card } from '@zed-hosting/ui-kit';
import { GameServer } from '../types/server';
import { apiClient } from '../lib/api-client';

interface ServerCardProps {
  server: GameServer;
}

export function ServerCard({ server }: ServerCardProps) {
  const t = useTranslations();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return 'bg-green-500';
      case 'STOPPED':
        return 'bg-gray-500';
      case 'STARTING':
        return 'bg-yellow-500 animate-pulse';
      case 'STOPPING':
        return 'bg-orange-500 animate-pulse';
      case 'INSTALLING':
      case 'UPDATING':
        return 'bg-blue-500 animate-pulse';
      case 'CRASHED':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    const key = `dashboard.server.status.${status.toLowerCase()}`;
    return t(key);
  };

  return (
    <Card className="bg-gray-800/60 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold mb-1">{server.gameType}</h3>
            <p className="text-sm text-gray-400">{server.gameType}</p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${getStatusColor(server.status)}`}
            />
            <span className="text-sm text-gray-300">
              {getStatusText(server.status)}
            </span>
          </div>
        </div>

        {/* Resource Usage */}
        {server.metrics && (
          <div className="mb-4 space-y-2">
            {server.metrics.cpuUsage !== undefined && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">
                    {t('dashboard.server.resources.cpu')}
                  </span>
                  <span className="text-gray-300">{server.metrics.cpuUsage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${server.metrics.cpuUsage}%` }}
                  />
                </div>
              </div>
            )}
            {server.metrics.ramUsagePercent !== undefined && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">
                    {t('dashboard.server.resources.ram')}
                  </span>
                  <span className="text-gray-300">{server.metrics.ramUsagePercent.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${server.metrics.ramUsagePercent}%` }}
                  />
                </div>
              </div>
            )}
            {server.metrics.diskUsagePercent !== undefined && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">
                    {t('dashboard.server.resources.disk')}
                  </span>
                  <span className="text-gray-300">{server.metrics.diskUsagePercent.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full transition-all"
                    style={{ width: `${server.metrics.diskUsagePercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          {server.status === 'STOPPED' && (
            <Button 
              size="sm" 
              variant="primary" 
              className="flex-1"
              onClick={async () => {
                try {
                  await apiClient.post(`/servers/${server.uuid}/start`);
                  window.location.reload();
                } catch (error) {
                  console.error('Failed to start server:', error);
                  alert('Failed to start server');
                }
              }}
            >
              {t('dashboard.server.actions.start')}
            </Button>
          )}
          {server.status === 'RUNNING' && (
            <>
              <Button 
                size="sm" 
                variant="secondary" 
                className="flex-1"
                onClick={async () => {
                  try {
                    await apiClient.post(`/servers/${server.uuid}/stop`);
                    window.location.reload();
                  } catch (error) {
                    console.error('Failed to stop server:', error);
                    alert('Failed to stop server');
                  }
                }}
              >
                {t('dashboard.server.actions.stop')}
              </Button>
              <Button 
                size="sm" 
                variant="secondary" 
                className="flex-1"
                onClick={async () => {
                  try {
                    await apiClient.post(`/servers/${server.uuid}/restart`);
                    window.location.reload();
                  } catch (error) {
                    console.error('Failed to restart server:', error);
                    alert('Failed to restart server');
                  }
                }}
              >
                {t('dashboard.server.actions.restart')}
              </Button>
            </>
          )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.location.href = `/dashboard/server/${server.uuid}`}
                >
                  {t('dashboard.server.actions.view') || 'View'}
                </Button>
        </div>
      </div>
    </Card>
  );
}

