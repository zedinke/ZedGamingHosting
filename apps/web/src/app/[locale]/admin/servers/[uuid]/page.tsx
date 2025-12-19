'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '../../../../../stores/auth-store';
import { Navigation } from '../../../../../components/navigation';
import { Card, Button } from '@zed-hosting/ui-kit';
import { apiClient } from '../../../../../lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { useNotificationContext } from '../../../../../context/notification-context';
import { useSocketContext } from '../../../../../contexts/socket-context';
import { GameServer } from '../../../../../types/server';

interface ServerMetrics {
  cpu: number;
  memory: {
    used: number;
    total: number;
    percent: number;
  };
  disk: Array<{ mount: string; used: number; total: number; percent: number }>;
  network: { in: number; out: number };
  containerCount: number;
  timestamp: number;
  nodeId: string;
  nodeName: string;
}

export default function AdminServerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user: currentUser, isAuthenticated, accessToken } = useAuthStore();
  const notifications = useNotificationContext();
  const socket = useSocketContext();
  const locale = (params?.locale as string) || 'hu';
  const serverUuid = params?.uuid as string;
  const [isHydrated, setIsHydrated] = useState(false);
  const [realtimeMetrics, setRealtimeMetrics] = useState<ServerMetrics | null>(null);

  useEffect(() => {
    setIsHydrated(true);
    if (accessToken) {
      apiClient.setAccessToken(accessToken);
    }
  }, [accessToken]);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }

    const userRole = currentUser?.role?.toUpperCase();
    if (isHydrated && isAuthenticated && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'SUPERADMIN' && userRole !== 'RESELLER_ADMIN') {
      router.push(`/${locale}/dashboard`);
      return;
    }
  }, [isAuthenticated, isHydrated, currentUser, router, locale]);

  const { data: server, isLoading } = useQuery<GameServer>({
    queryKey: ['admin-server', serverUuid],
    queryFn: async () => {
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
    enabled: !!accessToken && !!serverUuid && isHydrated,
    refetchInterval: 30000,
  });

  // Handle real-time metrics from WebSocket
  const handleServerMetricsUpdate = useCallback((data: ServerMetrics) => {
    setRealtimeMetrics(data);
  }, []);

  // Subscribe to server metrics updates
  useEffect(() => {
    if (!socket || !server?.nodeId) return;

    // Subscribe to server metrics
    socket.subscribeToServer(server.nodeId);

    // Listen for metrics updates
    const unsubscribe = socket.subscribe('server:metricsUpdate', handleServerMetricsUpdate);

    return () => {
      unsubscribe();
      socket.unsubscribeFromServer(server.nodeId);
    };
  }, [socket, server?.nodeId, handleServerMetricsUpdate]);

  const handleDelete = async () => {
    if (!window.confirm('Biztosan törölni szeretnéd ezt a szervert? Ez a művelet nem visszavonható!')) {
      return;
    }

    try {
      await apiClient.delete(`/servers/${serverUuid}`);
      notifications.addNotification({
        type: 'success',
        title: 'Szerver törölve',
        message: 'A szerver sikeresen törölve.',
      });
      router.push(`/${locale}/admin/servers`);
    } catch (err: any) {
      notifications.addNotification({
        type: 'error',
        title: 'Hiba',
        message: err.message || 'Szerver törlése sikertelen',
      });
    }
  };

  if (!isHydrated) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  const userRole = currentUser?.role?.toUpperCase();
  if (!isAuthenticated || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'SUPERADMIN' && userRole !== 'RESELLER_ADMIN')) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Redirecting...</p>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen" style={{ 
        backgroundColor: '#0a0a0a', 
        background: 'radial-gradient(at 0% 0%, rgba(14, 165, 233, 0.1) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(59, 130, 246, 0.1) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(14, 165, 233, 0.05) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(59, 130, 246, 0.05) 0px, transparent 50%), #0a0a0a',
        color: '#f8fafc',
        minHeight: '100vh'
      }}>
        <div className="container mx-auto px-4 py-8">
          <header className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2" style={{ color: '#f8fafc' }}>
                  Admin - Szerver Részletek
                </h1>
                <p style={{ color: '#cbd5e1' }}>
                  {server?.gameType || 'Loading...'} - {server?.uuid?.substring(0, 8) || ''}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/${locale}/dashboard/server/${serverUuid}`)}
                >
                  Felhasználói nézet
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/${locale}/admin/servers`)}
                >
                  Vissza
                </Button>
              </div>
            </div>
          </header>

          {isLoading ? (
            <div className="text-center py-12">
              <p style={{ color: '#cbd5e1' }}>Betöltés...</p>
            </div>
          ) : server ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="glass elevation-2 p-6">
                <h2 className="text-xl font-semibold mb-4" style={{ color: '#f8fafc' }}>
                  Szerver Információk
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span style={{ color: '#cbd5e1' }}>UUID:</span>
                    <code className="text-xs" style={{ color: '#f8fafc' }}>{server.uuid}</code>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#cbd5e1' }}>Játék típus:</span>
                    <span style={{ color: '#f8fafc' }}>{server.gameType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#cbd5e1' }}>Státusz:</span>
                    <span style={{ 
                      color: server.status === 'RUNNING' ? '#10b981' : server.status === 'STOPPED' ? '#6b7280' : '#f59e0b'
                    }}>
                      {server.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#cbd5e1' }}>Node:</span>
                    <span style={{ color: '#f8fafc' }}>{server.node?.name || server.nodeId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#cbd5e1' }}>Tulajdonos ID:</span>
                    <span style={{ color: '#f8fafc' }}>{server.ownerId}</span>
                  </div>
                </div>
              </Card>

              <Card className="glass elevation-2 p-6">
                <h2 className="text-xl font-semibold mb-4" style={{ color: '#f8fafc' }}>
                  Valós Idejű Mérőszámok
                  {realtimeMetrics && (
                    <span style={{ fontSize: '0.875rem', color: '#10b981', marginLeft: '0.5rem' }}>
                      (élő)
                    </span>
                  )}
                </h2>
                {realtimeMetrics ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span style={{ color: '#cbd5e1' }}>CPU Használat:</span>
                      <div className="flex items-center gap-2">
                        <span style={{ color: '#f8fafc' }}>{realtimeMetrics.cpu.toFixed(1)}%</span>
                        <div style={{ width: '100px', height: '4px', backgroundColor: '#1e293b', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ 
                            width: `${Math.min(realtimeMetrics.cpu, 100)}%`, 
                            height: '100%', 
                            backgroundColor: realtimeMetrics.cpu > 80 ? '#ef4444' : realtimeMetrics.cpu > 60 ? '#f59e0b' : '#10b981',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#cbd5e1' }}>RAM Használat:</span>
                      <div className="flex items-center gap-2">
                        <span style={{ color: '#f8fafc' }}>
                          {(realtimeMetrics.memory.used / 1024 / 1024 / 1024).toFixed(1)} GB / {(realtimeMetrics.memory.total / 1024 / 1024 / 1024).toFixed(1)} GB ({realtimeMetrics.memory.percent.toFixed(1)}%)
                        </span>
                        <div style={{ width: '100px', height: '4px', backgroundColor: '#1e293b', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ 
                            width: `${Math.min(realtimeMetrics.memory.percent, 100)}%`, 
                            height: '100%', 
                            backgroundColor: realtimeMetrics.memory.percent > 80 ? '#ef4444' : realtimeMetrics.memory.percent > 60 ? '#f59e0b' : '#10b981',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>
                    </div>
                    {realtimeMetrics.disk.length > 0 && (
                      <div className="flex justify-between">
                        <span style={{ color: '#cbd5e1' }}>Disk Használat:</span>
                        <div className="flex items-center gap-2">
                          <span style={{ color: '#f8fafc' }}>
                            {(realtimeMetrics.disk[0].used / 1024 / 1024 / 1024).toFixed(1)} GB / {(realtimeMetrics.disk[0].total / 1024 / 1024 / 1024).toFixed(1)} GB ({realtimeMetrics.disk[0].percent.toFixed(1)}%)
                          </span>
                          <div style={{ width: '100px', height: '4px', backgroundColor: '#1e293b', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ 
                              width: `${Math.min(realtimeMetrics.disk[0].percent, 100)}%`, 
                              height: '100%', 
                              backgroundColor: realtimeMetrics.disk[0].percent > 80 ? '#ef4444' : realtimeMetrics.disk[0].percent > 60 ? '#f59e0b' : '#10b981',
                              transition: 'width 0.3s ease'
                            }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '1rem' }}>
                      Utolsó frissítés: {new Date(realtimeMetrics.timestamp).toLocaleTimeString('hu-HU')}
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#64748b' }}>
                    Várakozás a valós idejű adatokra...
                  </div>
                )}
              </Card>

              <Card className="glass elevation-2 p-6 md:col-span-2">
                <h2 className="text-xl font-semibold mb-4" style={{ color: '#f8fafc' }}>
                  Admin Műveletek
                </h2>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/${locale}/dashboard/server/${serverUuid}`)}
                  >
                    Szerver kezelése
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDelete}
                    style={{ color: '#ef4444' }}
                  >
                    Szerver törlése
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            <Card className="glass elevation-2 p-12 text-center">
              <p style={{ color: '#cbd5e1' }}>Szerver nem található</p>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}

