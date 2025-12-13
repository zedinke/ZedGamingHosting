'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@zed-hosting/ui-kit';
import { Button } from '@zed-hosting/ui-kit';
import { Badge } from '@zed-hosting/ui-kit';
import { GameServer } from '../types/server';
import { apiClient } from '../lib/api-client';
import { useRouter } from 'next/navigation';
import { cn } from '../lib/utils';
import { Play, Square, RotateCw, Settings, Terminal } from 'lucide-react';

interface ServerCardProps {
  server: GameServer;
}

export function ServerCard({ server }: ServerCardProps) {
  const t = useTranslations();
  const router = useRouter();
  const locale = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] || 'hu' : 'hu';

  const getStatusVariant = (status: string): 'default' | 'success' | 'danger' | 'warning' | 'info' => {
    switch (status) {
      case 'RUNNING':
        return 'success';
      case 'STOPPED':
        return 'default';
      case 'STARTING':
      case 'STOPPING':
        return 'warning';
      case 'INSTALLING':
      case 'UPDATING':
        return 'info';
      case 'CRASHED':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    const key = `dashboard.server.status.${status.toLowerCase()}`;
    return t(key);
  };

  const handleAction = async (action: 'start' | 'stop' | 'restart') => {
    try {
      await apiClient.post(`/servers/${server.uuid}/${action}`);
      window.location.reload();
    } catch (error: any) {
      alert(error.message || `Failed to ${action} server`);
    }
  };

  const isRunning = server.status === 'RUNNING';
  const isStopped = server.status === 'STOPPED';

  return (
    <Card
      hoverable
      className={cn(
        'group cursor-pointer overflow-hidden',
        'border-border bg-background-tertiary'
      )}
      onClick={() => router.push(`/${locale}/dashboard/server/${server.uuid}`)}
    >
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold mb-1 truncate text-text-primary">
              {(server as any).name || server.gameType}
            </h3>
            <p className="text-sm truncate text-text-tertiary">
              {server.gameType}
            </p>
          </div>
          <motion.div
            animate={isRunning ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Badge variant={getStatusVariant(server.status)} size="sm">
              {getStatusText(server.status)}
            </Badge>
          </motion.div>
        </div>

        {/* Resource Metrics */}
        {server.metrics && (
          <div className="space-y-3 mb-4">
            {server.metrics.cpuUsage !== undefined && (
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span style={{ color: 'var(--color-text-muted)' }}>
                    {t('dashboard.server.resources.cpu')}
                  </span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    {server.metrics.cpuUsage.toFixed(1)}%
                  </span>
                </div>
                <div 
                  className="w-full rounded-full overflow-hidden"
                  style={{ backgroundColor: 'var(--color-bg-surface)', height: '6px' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-blue-500 to-blue-400"
                    style={{ width: `${Math.min(server.metrics.cpuUsage, 100)}%` }}
                  />
                </div>
              </div>
            )}
            {server.metrics.ramUsagePercent !== undefined && (
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span style={{ color: 'var(--color-text-muted)' }}>
                    {t('dashboard.server.resources.ram')}
                  </span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    {server.metrics.ramUsagePercent.toFixed(1)}%
                  </span>
                </div>
                <div 
                  className="w-full rounded-full overflow-hidden"
                  style={{ backgroundColor: 'var(--color-bg-surface)', height: '6px' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-green-500 to-green-400"
                    style={{ width: `${Math.min(server.metrics.ramUsagePercent, 100)}%` }}
                  />
                </div>
              </div>
            )}
            {server.metrics.diskUsagePercent !== undefined && (
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span style={{ color: 'var(--color-text-muted)' }}>
                    {t('dashboard.server.resources.disk')}
                  </span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    {server.metrics.diskUsagePercent.toFixed(1)}%
                  </span>
                </div>
                <div 
                  className="w-full rounded-full overflow-hidden"
                  style={{ backgroundColor: 'var(--color-bg-surface)', height: '6px' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-yellow-500 to-yellow-400"
                    style={{ width: `${Math.min(server.metrics.diskUsagePercent, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-border">
          {isStopped && (
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                handleAction('start');
              }}
            >
              <Play className="h-4 w-4 mr-1" />
              {t('dashboard.server.actions.start')}
            </Button>
          )}
          {isRunning && (
            <>
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction('stop');
                }}
              >
                <Square className="h-4 w-4 mr-1" />
                {t('dashboard.server.actions.stop')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction('restart');
                }}
              >
                <RotateCw className="h-4 w-4 mr-1" />
                {t('dashboard.server.actions.restart')}
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/${locale}/dashboard/server/${server.uuid}/console`);
            }}
            title={t('dashboard.server.actions.console')}
          >
            <Terminal className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/${locale}/dashboard/server/${server.uuid}/settings`);
            }}
            title={t('dashboard.server.actions.settings')}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
