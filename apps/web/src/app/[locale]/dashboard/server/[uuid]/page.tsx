'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../../../lib/api-client';
import { useAuthStore } from '../../../../../stores/auth-store';
import { Button, UpdateProgressIndicator } from '@zed-hosting/ui-kit';
import { Card, CardContent, CardHeader, CardTitle } from '@zed-hosting/ui-kit';
import { Badge } from '@zed-hosting/ui-kit';
import { ProtectedRoute } from '../../../../../components/protected-route';
import { Navigation } from '../../../../../components/navigation';
import { GameServer } from '../../../../../types/server';
import Link from 'next/link';
import { ServerCloneDialog } from '../../../../../components/server-clone-dialog';
import { Copy, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNotificationContext } from '../../../../../context/notification-context';

export default function ServerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations();
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const serverUuid = params.uuid as string;
  const locale = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] || 'hu' : 'hu';
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<any>(null);
  const notifications = useNotificationContext();

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
        name: (response as any).name || response.gameType || 'Server',
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
      notifications.addNotification({
        type: 'success',
        title: 'Szerver indítva',
        message: 'A szerver sikeresen elindult.',
      });
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      notifications.addNotification({
        type: 'error',
        title: 'Hiba',
        message: err.message || 'A szerver indítása sikertelen volt.',
      });
    }
  };

  const handleStop = async () => {
    try {
      await apiClient.post(`/servers/${serverUuid}/stop`);
      notifications.addNotification({
        type: 'success',
        title: 'Szerver leállítva',
        message: 'A szerver sikeresen leállítva.',
      });
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      notifications.addNotification({
        type: 'error',
        title: 'Hiba',
        message: err.message || 'A szerver leállítása sikertelen volt.',
      });
    }
  };

  const handleRestart = async () => {
    try {
      await apiClient.post(`/servers/${serverUuid}/restart`);
      notifications.addNotification({
        type: 'success',
        title: 'Szerver újraindítva',
        message: 'A szerver sikeresen újraindult.',
      });
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      notifications.addNotification({
        type: 'error',
        title: 'Hiba',
        message: err.message || 'A szerver újraindítása sikertelen volt.',
      });
    }
  };

  const updateMutation = useMutation({
    mutationFn: () => apiClient.post(`/servers/${serverUuid}/update`, {}),
    onMutate: () => {
      setUpdateStatus({ status: 'pending', message: 'Frissítés indítása...' });
    },
    onSuccess: () => {
      setUpdateStatus({ status: 'downloading', message: 'Szerver frissítése folyamatban...' });
      notifications.addNotification({
        type: 'success',
        title: 'Frissítés indítva',
        message: 'A szerver frissítése megkezdődött.',
      });
      pollUpdateStatus();
    },
    onError: (err: any) => {
      setUpdateStatus({ status: 'failed', error: err.message });
      notifications.addNotification({
        type: 'error',
        title: 'Hiba',
        message: err.message || 'A szerver frissítése sikertelen volt.',
      });
    },
  });

  const pollUpdateStatus = async () => {
    const poll = async () => {
      try {
        const status = await apiClient.get<any>(`/servers/${serverUuid}/update/status`);
        setUpdateStatus({
          status: status.status,
          progress: status.progress,
          message: status.message,
          error: status.error,
        });

        if (!['pending', 'downloading'].includes(status.status)) {
          clearInterval(intervalId);
        }
      } catch (err) {
        console.error('Failed to poll update status:', err);
      }
    };

    const intervalId = setInterval(poll, 3000);
    poll();
  };

  const handleDelete = async () => {
    const confirmMessage = t('dashboard.server.deleteConfirm') || 'Are you sure you want to delete this server? This action cannot be undone.';
    if (!window.confirm(confirmMessage)) {
      return;
    }
    try {
      await apiClient.delete(`/servers/${serverUuid}`);
      notifications.addNotification({
        type: 'success',
        title: 'Szerver törölve',
        message: 'A szerver sikeresen törölve.',
      });
      router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      notifications.addNotification({
        type: 'error',
        title: 'Hiba',
        message: err.message || 'A szerver törlése sikertelen volt.',
      });
    }
  };

  const handleClone = async (data: {
    name?: string;
    nodeId?: string;
    resources?: { cpuLimit?: number; ramLimit?: number; diskLimit?: number };
    envVars?: Record<string, string>;
  }) => {
    try {
      await apiClient.post('/servers', {
        gameType: server?.gameType,
        name: data.name,
        nodeId: data.nodeId,
        resources: data.resources,
        envVars: data.envVars,
      });
      notifications.addNotification({
        type: 'success',
        title: 'Szerver klónozva',
        message: `A szerver sikeresen klónozva: ${data.name}`,
      });
      router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      notifications.addNotification({
        type: 'error',
        title: 'Hiba',
        message: err.message || 'A szerver klónozása sikertelen volt.',
      });
      throw new Error(err.message || 'Szerver klónozása sikertelen');
    }
  };

  const { data: nodes } = useQuery({
    queryKey: ['nodes'],
    queryFn: async () => {
      return await apiClient.get<any[]>('/nodes');
    },
    enabled: showCloneDialog,
  });

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

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12 min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            <p className="mt-4 text-sm text-text-muted">
              {t('loading') || 'Loading...'}
            </p>
          </div>
        </div>
      );
    }

    if (error || !server) {
      return (
        <div className="flex items-center justify-center py-12">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="mb-4 text-error-600">
                {error ? (error as Error).message : t('dashboard.server.notFound') || 'Server not found'}
              </p>
              <Button variant="outline" onClick={() => router.push(`/${locale}/dashboard`)}>
                {t('backToDashboard') || 'Back to Dashboard'}
              </Button>
            </CardContent>
          </Card>
        </div>
      );  <Button 
                variant="primary" 
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending || updateStatus?.status === 'downloading'}
              >
                <Download className="h-4 w-4 mr-2" />
                Frissítés
              </Button>
            
    }

    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-4"
          >
            ← {t('back') || 'Back'}
          </Button>
          
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-3 text-text-primary">
                {(server as any).name || server.gameType}
              </h1>
              <div className="flex items-center gap-3">
                <Badge variant={getStatusVariant(server.status)}>
                  {getStatusText(server.status)}
                </Badge>
                <span className="text-sm text-text-muted">
                  {server.gameType}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
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
            Update Progress */}
        {updateStatus && updateStatus.status !== 'idle' && (
          <div className="mb-8">
            <UpdateProgressIndicator
              progress={updateStatus}
              serverName={(server as any).name || server.gameType}
            />
          </div>
        )}

        {/*       </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6 border-b border-border">
          <nav className="flex gap-1 -mb-px">
            <Link
              href={`/${locale}/dashboard/server/${serverUuid}`}
              className="px-4 py-3 text-sm font-medium border-b-2 border-primary-500 text-primary-500 transition-colors"
            >
              {t('dashboard.server.tabs.overview') || 'Overview'}
            </Link>
            <Link
              href={`/${locale}/dashboard/server/${serverUuid}/console`}
              className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-text-muted hover:text-text-primary transition-colors"
            >
              {t('dashboard.server.tabs.console') || 'Console'}
            </Link>
            <Link
              href={`/${locale}/dashboard/server/${serverUuid}/files`}
              className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-text-muted hover:text-text-primary transition-colors"
            >
              {t('dashboard.server.tabs.files') || 'Files'}
            </Link>
            <Link
              href={`/${locale}/dashboard/server/${serverUuid}/settings`}
              className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-text-muted hover:text-text-primary transition-colors"
            >
              {t('dashboard.server.tabs.settings') || 'Settings'}
            </Link>
            <Link
              href={`/${locale}/dashboard/server/${serverUuid}/metrics`}
              className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-text-muted hover:text-text-primary transition-colors"
            >
              {t('dashboard.server.tabs.metrics') || 'Metrics'}
            </Link>
            <Link
              href={`/${locale}/dashboard/server/${serverUuid}/environment`}
              className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-text-muted hover:text-text-primary transition-colors"
            >
              {t('dashboard.server.tabs.environment') || 'Environment'}
            </Link>
            <Link
              href={`/${locale}/dashboard/server/${serverUuid}/backups`}
              className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-text-muted hover:text-text-primary transition-colors"
            >
              {t('dashboard.server.tabs.backups') || 'Backups'}
            </Link>
          </nav>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Server Information */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t('dashboard.server.info.title') || 'Server Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted">UUID:</span>
                <code className="text-xs px-2 py-1 rounded bg-background-surface text-text-primary font-mono">
                  {server.uuid.slice(0, 8)}...
                </code>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted">
                  {t('dashboard.server.info.gameType') || 'Game Type'}:
                </span>
                <span className="text-text-primary">{server.gameType}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted">
                  {t('dashboard.server.info.node') || 'Node'}:
                </span>
                <span className="text-text-primary">
                  {(server.node as any)?.name || server.nodeId}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Resources */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t('dashboard.server.resources.title') || 'Resources'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-text-muted">CPU:</span>
                  <span className="text-text-primary">
                    {server.resources?.cpuLimit || 0} {t('dashboard.server.resources.cores') || 'cores'}
                  </span>
                </div>
                {server.metrics?.cpuUsage !== undefined && (
                  <div className="w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg-surface)', height: '8px' }}>
                    <div
                      className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-blue-500 to-blue-400"
                      style={{ width: `${Math.min(server.metrics.cpuUsage || 0, 100)}%` }}
                    />
                  </div>
                )}
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-text-muted">RAM:</span>
                  <span className="text-text-primary">
                    {server.resources?.ramLimit || 0} MB
                  </span>
                </div>
                {server.metrics?.ramUsagePercent !== undefined && (
                  <div className="w-full rounded-full overflow-hidden bg-background-surface h-2">
                    <div
                      className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-green-500 to-green-400"
                      style={{ width: `${Math.min(server.metrics.ramUsagePercent || 0, 100)}%` }}
                    />
                  </div>
                )}
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-text-muted">Disk:</span>
                  <span className="text-text-primary">
                    {server.resources?.diskLimit || 0} GB
                  </span>
                </div>
                {server.metrics?.diskUsagePercent !== undefined && (
                  <div className="w-full rounded-full overflow-hidden bg-background-surface h-2">
                    <div
                      className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-yellow-500 to-yellow-400"
                      style={{ width: `${Math.min(server.metrics.diskUsagePercent || 0, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Network Ports */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t('dashboard.server.ports.title') || 'Network Ports'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {server.ports && server.ports.length > 0 ? (
                <div className="space-y-2">
                  {server.ports.map((port: any, index: number) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2 rounded-lg text-sm bg-background-surface"
                    >
                      <span className="text-text-primary font-mono">
                        {port.type}:{port.port}
                      </span>
                      <Badge
                        variant={port.protocol === 'TCP' ? 'info' : 'success'}
                        size="sm"
                      >
                        {port.protocol}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-center py-4 text-text-muted">
                  {t('dashboard.server.ports.none') || 'No ports allocated'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t('dashboard.server.quickActions') || 'Quick Actions'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              <Link href={`/${locale}/dashboard/server/${serverUuid}/console`}>
                <Button variant="outline">
                  {t('dashboard.server.actions.console')}
                </Button>
              </Link>
              <Link href={`/${locale}/dashboard/server/${serverUuid}/files`}>
                <Button variant="outline">
                  {t('dashboard.server.actions.files') || 'File Manager'}
                </Button>
              </Link>
              <Link href={`/${locale}/dashboard/server/${serverUuid}/settings`}>
                <Button variant="outline">
                  {t('dashboard.server.actions.settings') || 'Settings'}
                </Button>
              </Link>
              <Link href={`/${locale}/dashboard/server/${serverUuid}/metrics`}>
                <Button variant="outline">
                  {t('dashboard.server.actions.metrics') || 'Metrics'}
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => setShowCloneDialog(true)}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Klónozás
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
              >
                {t('dashboard.server.actions.delete') || 'Delete'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background-app">
        <Navigation />
        {renderContent()}
        
        {showCloneDialog && server && (
          <ServerCloneDialog
            server={server}
            onClose={() => setShowCloneDialog(false)}
            onClone={handleClone}
            nodes={nodes?.map((n: any) => ({ id: n.id, name: n.name }))}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
