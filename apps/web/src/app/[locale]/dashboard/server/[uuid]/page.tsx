'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../../lib/api-client';
import { useAuthStore } from '../../../../../stores/auth-store';
import { Button } from '@zed-hosting/ui-kit';
import { ProtectedRoute } from '../../../../../components/protected-route';
import { GameServer } from '../../../../../types/server';
import Link from 'next/link';

export default function ServerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations();
  const { accessToken } = useAuthStore();
  const serverUuid = params.uuid as string;

  const { data: server, isLoading, error } = useQuery<GameServer>({
    queryKey: ['server', serverUuid],
    queryFn: async () => {
      apiClient.setAccessToken(accessToken);
      const response = await apiClient.get<any>(`/servers/${serverUuid}`);
      return {
        uuid: response.uuid,
        id: response.id,
        gameType: response.gameType,
        status: response.status,
        nodeId: response.nodeId,
        ownerId: response.ownerId,
        startupPriority: response.startupPriority,
        resources: response.resources || { cpuLimit: 0, ramLimit: 0, diskLimit: 0 },
        envVars: response.envVars || {},
        clusterId: response.clusterId,
        createdAt: new Date(response.createdAt),
        updatedAt: new Date(response.updatedAt),
        name: response.name || response.gameType || 'Server',
        metrics: response.metrics?.[0] || { cpuUsage: 0, ramUsage: 0, diskUsage: 0 },
        node: response.node,
        ports: response.networkAllocations || [],
      };
    },
    enabled: !!accessToken && !!serverUuid,
    refetchInterval: 30000,
  });

  const handleStart = async () => {
    try {
      await apiClient.post(`/servers/${serverUuid}/start`);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Failed to start server');
    }
  };

  const handleStop = async () => {
    try {
      await apiClient.post(`/servers/${serverUuid}/stop`);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Failed to stop server');
    }
  };

  const handleRestart = async () => {
    try {
      await apiClient.post(`/servers/${serverUuid}/restart`);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Failed to restart server');
    }
  };

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/servers/${serverUuid}`);
      router.push('/dashboard');
    } catch (err: any) {
      alert(err.message || 'Failed to delete server');
    }
  };

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
      case 'RESTARTING':
        return 'bg-blue-500 animate-pulse';
      case 'INSTALLING':
        return 'bg-purple-500 animate-pulse';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    const key = `dashboard.server.status.${status.toLowerCase()}`;
    return t(key);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-app)' }}>
        <div className="container mx-auto px-4 py-8">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">{t('loading') || 'Loading...'}</p>
            </div>
          ) : error || !server ? (
            <div className="text-center py-12">
              <p className="text-red-400">
                {error ? (error as Error).message : t('dashboard.server.notFound') || 'Server not found'}
              </p>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="mt-4"
              >
                {t('backToDashboard') || 'Back to Dashboard'}
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="mb-4"
                >
                  ← {t('back') || 'Back'}
                </Button>
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-main)' }}>
                      {(server as any).name || server.gameType}
                    </h1>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(server.status)}`} />
                      <span className="text-gray-300">{getStatusText(server.status)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {server.status === 'STOPPED' && (
                      <Button variant="primary" onClick={handleStart}>
                        {t('dashboard.server.actions.start')}
                      </Button>
                    )}
                    {server.status === 'RUNNING' && (
                      <>
                        <Button variant="secondary" onClick={handleStop}>
                          {t('dashboard.server.actions.stop')}
                        </Button>
                        <Button variant="secondary" onClick={handleRestart}>
                          {t('dashboard.server.actions.restart')}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-b border-gray-700 mb-6">
                <nav className="flex gap-4">
                  <Link
                    href={`/dashboard/server/${serverUuid}`}
                    className="pb-4 px-2 border-b-2 border-blue-500 text-blue-400 font-medium"
                  >
                    {t('dashboard.server.tabs.overview') || 'Overview'}
                  </Link>
                  <Link
                    href={`/dashboard/server/${serverUuid}/console`}
                    className="pb-4 px-2 text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    {t('dashboard.server.tabs.console') || 'Console'}
                  </Link>
                  <Link
                    href={`/dashboard/server/${serverUuid}/files`}
                    className="pb-4 px-2 text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    {t('dashboard.server.tabs.files') || 'Files'}
                  </Link>
                  <Link
                    href={`/dashboard/server/${serverUuid}/settings`}
                    className="pb-4 px-2 text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    {t('dashboard.server.tabs.settings') || 'Settings'}
                  </Link>
                  <Link
                    href={`/dashboard/server/${serverUuid}/metrics`}
                    className="pb-4 px-2 text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    {t('dashboard.server.tabs.metrics') || 'Metrics'}
                  </Link>
                </nav>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div
                  className="rounded-lg p-6 border"
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-main)' }}>
                    {t('dashboard.server.info.title') || 'Server Information'}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--color-text-muted)' }}>UUID:</span>
                      <span style={{ color: 'var(--color-text-main)' }} className="font-mono text-xs">
                        {server.uuid}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--color-text-muted)' }}>
                        {t('dashboard.server.info.gameType') || 'Game Type'}:
                      </span>
                      <span style={{ color: 'var(--color-text-main)' }}>{server.gameType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--color-text-muted)' }}>
                        {t('dashboard.server.info.node') || 'Node'}:
                      </span>
                      <span style={{ color: 'var(--color-text-main)' }}>
                        {(server.node as any)?.name || server.nodeId}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-lg p-6 border"
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-main)' }}>
                    {t('dashboard.server.resources.title') || 'Resources'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span style={{ color: 'var(--color-text-muted)' }}>CPU:</span>
                        <span style={{ color: 'var(--color-text-main)' }}>
                          {server.resources?.cpuLimit || 0} {t('dashboard.server.resources.cores') || 'cores'}
                        </span>
                      </div>
                      {server.metrics?.cpuUsage !== undefined && (
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${server.metrics.cpuUsage}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span style={{ color: 'var(--color-text-muted)' }}>RAM:</span>
                        <span style={{ color: 'var(--color-text-main)' }}>
                          {server.resources?.ramLimit || 0} MB
                        </span>
                      </div>
                      {server.metrics?.ramUsage !== undefined && (
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${server.metrics.ramUsage}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span style={{ color: 'var(--color-text-muted)' }}>Disk:</span>
                        <span style={{ color: 'var(--color-text-main)' }}>
                          {server.resources?.diskLimit || 0} GB
                        </span>
                      </div>
                      {server.metrics?.diskUsage !== undefined && (
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-yellow-500 h-2 rounded-full transition-all"
                            style={{ width: `${server.metrics.diskUsage}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-lg p-6 border"
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-main)' }}>
                    {t('dashboard.server.ports.title') || 'Network Ports'}
                  </h3>
                  <div className="space-y-2">
                    {server.ports && server.ports.length > 0 ? (
                      server.ports.map((port: any, index: number) => (
                        <div
                          key={index}
                          className="flex justify-between items-center text-sm p-2 rounded"
                          style={{ backgroundColor: 'var(--color-bg-app)' }}
                        >
                          <span style={{ color: 'var(--color-text-main)' }}>
                            {port.type}:{port.port}
                          </span>
                          <span
                            className="text-xs px-2 py-1 rounded"
                            style={{
                              backgroundColor: port.protocol === 'TCP' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                              color: port.protocol === 'TCP' ? '#60a5fa' : '#4ade80',
                            }}
                          >
                            {port.protocol}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400">
                        {t('dashboard.server.ports.none') || 'No ports allocated'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-main)' }}>
                  {t('dashboard.server.quickActions') || 'Quick Actions'}
                </h2>
                <div className="flex gap-4 flex-wrap">
                  <Link href={`/dashboard/server/${serverUuid}/console`}>
                    <Button variant="outline" className="w-full sm:w-auto">
                      {t('dashboard.server.actions.console')}
                    </Button>
                  </Link>
                  <Link href={`/dashboard/server/${serverUuid}/files`}>
                    <Button variant="outline" className="w-full sm:w-auto">
                      {t('dashboard.server.actions.files') || 'File Manager'}
                    </Button>
                  </Link>
                  <Link href={`/dashboard/server/${serverUuid}/settings`}>
                    <Button variant="outline" className="w-full sm:w-auto">
                      {t('dashboard.server.actions.settings') || 'Settings'}
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => {
                      if (confirm(t('dashboard.server.deleteConfirm') || 'Are you sure you want to delete this server? This action cannot be undone.'))) {
                        handleDelete();
                      }
                    }}
                  >
                    {t('dashboard.server.actions.delete') || 'Delete'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
