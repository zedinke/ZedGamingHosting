'use client';

import { useTranslations } from '@i18n/translations';
import { useAuthStore } from '../../../../stores/auth-store';
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../../lib/api-client';
import { 
  ServerCard, 
  ServerStatusBadge, 
  UpdateProgressIndicator,
  Button,
  Skeleton
} from '@zed-hosting/ui-kit';
import { useRouter } from 'next/navigation';
import { Navigation } from '../../../../components/navigation';
import { ToastContainer } from '../../../../components/toast-container';
import { useNotificationContext } from '../../../../context/notification-context';
import { Plus, Search } from 'lucide-react';

interface Server {
  uuid: string;
  id: number;
  gameType: string;
  status: 'running' | 'stopped' | 'starting' | 'stopping' | 'updating' | 'error';
  name?: string;
  node?: {
    name: string;
    fqdn: string;
  };
  networkAllocations?: Array<{
    ip: string;
    port: number;
    isPrimary: boolean;
  }>;
  metrics?: {
    cpuUsage?: number;
    ramUsage?: number;
    ramLimit?: number;
  };
  resources?: {
    ramLimit?: number;
  };
}

interface UpdateStatus {
  status: 'idle' | 'pending' | 'downloading' | 'completed' | 'failed';
  progress?: number;
  message?: string;
  error?: string;
}

export default function ServersPage() {
  const t = useTranslations();
  const router = useRouter();
  const { isAuthenticated, accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const notifications = useNotificationContext();
  const [isHydrated, setIsHydrated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [updateStatuses, setUpdateStatuses] = useState<Record<string, UpdateStatus>>({});

  const locale = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] || 'hu' : 'hu';

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (accessToken) {
      apiClient.setAccessToken(accessToken);
    }
  }, [accessToken]);

  // Fetch servers
  const { data: servers, isLoading } = useQuery<Server[]>({
    queryKey: ['servers'],
    queryFn: async () => {
      const response = await apiClient.get<any[]>('/servers');
      return response.map((server) => ({
        ...server,
        createdAt: new Date(server.createdAt),
        updatedAt: new Date(server.updatedAt),
      }));
    },
    enabled: isAuthenticated && isHydrated && !!accessToken,
    refetchInterval: 30000,
  });

  // Server control mutations
  const startMutation = useMutation({
    mutationFn: (uuid: string) => apiClient.post(`/servers/${uuid}/start`, {}),
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

  const stopMutation = useMutation({
    mutationFn: (uuid: string) => apiClient.post(`/servers/${uuid}/stop`, {}),
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

  const restartMutation = useMutation({
    mutationFn: (uuid: string) => apiClient.post(`/servers/${uuid}/restart`, {}),
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

  const updateMutation = useMutation({
    mutationFn: (uuid: string) => apiClient.post(`/servers/${uuid}/update`, {}),
    onMutate: (uuid: string) => {
      setUpdateStatuses(prev => ({
        ...prev,
        [uuid]: { status: 'pending', message: 'Frissítés indítása...' }
      }));
    },
    onSuccess: (_, uuid: string) => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      notifications.addNotification({
        type: 'success',
        title: 'Frissítés indítva',
        message: 'A szerver frissítése megkezdődött.',
      });
      // Start polling update status
      pollUpdateStatus(uuid);
    },
    onError: (err: any, uuid: string) => {
      setUpdateStatuses(prev => ({
        ...prev,
        [uuid]: { status: 'failed', error: err.message }
      }));
      notifications.addNotification({
        type: 'error',
        title: 'Hiba',
        message: err.message || 'A szerver frissítése sikertelen volt.',
      });
    },
  });

  // Poll update status
  const pollUpdateStatus = async (uuid: string) => {
    const poll = async () => {
      try {
        const status = await apiClient.get<any>(`/servers/${uuid}/update/status`);
        setUpdateStatuses(prev => ({
          ...prev,
          [uuid]: {
            status: status.status,
            progress: status.progress,
            message: status.message,
            error: status.error,
          }
        }));

        if (!['pending', 'downloading'].includes(status.status)) {
          clearInterval(intervalId);
        }
      } catch (err) {
        console.error('Failed to poll update status:', err);
      }
    };

    const intervalId = setInterval(poll, 3000);
    poll(); // Initial poll
  };

  // Filter servers
  const filteredServers = servers?.filter((server) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      server.gameType.toLowerCase().includes(query) ||
      server.uuid.toLowerCase().includes(query) ||
      (server.name && server.name.toLowerCase().includes(query))
    );
  });

  // Calculate uptime
  const calculateUptime = (server: Server): string | undefined => {
    if (server.status !== 'running') return undefined;
    // This would come from server metrics in real implementation
    return '2h 34m';
  };

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push(`/${locale}/login`);
    }
  }, [isAuthenticated, isHydrated, router, locale]);

  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background-app text-text-primary flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <ToastContainer />
      
      <main className="min-h-screen bg-background-app pt-20 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Szervereim
            </h1>
            <p className="text-text-secondary">
              Kezeld a szervereidet egyszerűen
            </p>
          </div>

          {/* Actions bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
              <input
                type="text"
                placeholder="Keresés szerverek között..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background-surface border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button
              variant="primary"
              onClick={() => router.push(`/${locale}/dashboard/create`)}
            >
              <Plus className="h-5 w-5 mr-2" />
              Új szerver
            </Button>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && (!filteredServers || filteredServers.length === 0) && (
            <div className="text-center py-12">
              <p className="text-text-secondary mb-4">
                {searchQuery ? 'Nincs találat' : 'Még nincs szervered'}
              </p>
              {!searchQuery && (
                <Button
                  variant="primary"
                  onClick={() => router.push(`/${locale}/dashboard/create`)}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Első szerver létrehozása
                </Button>
              )}
            </div>
          )}

          {/* Servers grid */}
          {!isLoading && filteredServers && filteredServers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServers.map((server) => {
                const primaryAllocation = server.networkAllocations?.find(a => a.isPrimary);
                const updateStatus = updateStatuses[server.uuid];

                return (
                  <div key={server.uuid} className="space-y-3">
                    <ServerCard
                      name={server.name || server.gameType}
                      uuid={server.uuid}
                      game={server.gameType}
                      status={server.status}
                      ip={primaryAllocation?.ip}
                      port={primaryAllocation?.port}
                      cpu={server.metrics?.cpuUsage}
                      memory={
                        server.metrics?.ramUsage && server.resources?.ramLimit
                          ? {
                              used: server.metrics.ramUsage,
                              total: server.resources.ramLimit,
                            }
                          : undefined
                      }
                      uptime={calculateUptime(server)}
                      onStart={() => startMutation.mutate(server.uuid)}
                      onStop={() => stopMutation.mutate(server.uuid)}
                      onRestart={() => restartMutation.mutate(server.uuid)}
                      onUpdate={() => updateMutation.mutate(server.uuid)}
                      onConsole={() => router.push(`/${locale}/dashboard/server/${server.uuid}/console`)}
                      onSettings={() => router.push(`/${locale}/dashboard/server/${server.uuid}`)}
                    />
                    
                    {/* Update progress indicator */}
                    {updateStatus && updateStatus.status !== 'idle' && (
                      <UpdateProgressIndicator
                        progress={updateStatus}
                        serverName={server.name || server.gameType}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
