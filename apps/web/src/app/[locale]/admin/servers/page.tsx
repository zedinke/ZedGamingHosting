'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '../../../../stores/auth-store';
import { Navigation } from '../../../../components/navigation';
import { Card, Button } from '@zed-hosting/ui-kit';
import { apiClient } from '../../../../lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { GameServer } from '../../../../types/server';

export default function AdminServersPage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations();
  const { user: currentUser, isAuthenticated, accessToken } = useAuthStore();
  const locale = (params.locale as string) || 'hu';
  const [isHydrated, setIsHydrated] = useState(false);

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

  // Note: This would need an admin endpoint that returns all servers
  const { data: servers, isLoading } = useQuery<GameServer[]>({
    queryKey: ['admin-servers'],
    queryFn: async () => {
      // TODO: Implement GET /api/admin/servers endpoint
      // For now, we'll use the regular endpoint (which only returns user's servers)
      const response = await apiClient.get<any[]>('/servers');
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
    },
    enabled: isHydrated && isAuthenticated && !!accessToken,
    refetchInterval: 30000,
  });

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return '#10b981';
      case 'STOPPED':
        return '#6b7280';
      case 'STARTING':
      case 'STOPPING':
        return '#f59e0b';
      case 'CRASHED':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const statusCounts = servers?.reduce((acc, server) => {
    acc[server.status] = (acc[server.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

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
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#f8fafc' }}>Összes Szerver</h1>
            <p style={{ color: '#cbd5e1' }}>
              Összes szerver áttekintése és kezelése
            </p>
          </header>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="glass elevation-2 p-6">
              <h3 className="text-sm mb-2" style={{ color: '#cbd5e1' }}>Összes</h3>
              <p className="text-3xl font-bold" style={{ color: '#f8fafc' }}>
                {servers?.length || 0}
              </p>
            </Card>
            <Card className="glass elevation-2 p-6">
              <h3 className="text-sm mb-2" style={{ color: '#cbd5e1' }}>Futó</h3>
              <p className="text-3xl font-bold" style={{ color: '#10b981' }}>
                {statusCounts.RUNNING || 0}
              </p>
            </Card>
            <Card className="glass elevation-2 p-6">
              <h3 className="text-sm mb-2" style={{ color: '#cbd5e1' }}>Leállítva</h3>
              <p className="text-3xl font-bold" style={{ color: '#6b7280' }}>
                {statusCounts.STOPPED || 0}
              </p>
            </Card>
            <Card className="glass elevation-2 p-6">
              <h3 className="text-sm mb-2" style={{ color: '#cbd5e1' }}>Hibás</h3>
              <p className="text-3xl font-bold" style={{ color: '#ef4444' }}>
                {statusCounts.CRASHED || 0}
              </p>
            </Card>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p style={{ color: '#cbd5e1' }}>Betöltés...</p>
            </div>
          ) : !servers || servers.length === 0 ? (
            <Card className="glass elevation-2 p-12 text-center">
              <p style={{ color: '#cbd5e1' }}>
                Nincs szerver
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {servers.map((server) => (
                <Card key={server.uuid} className="glass elevation-2 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getStatusColor(server.status) }}
                        />
                        <h3 className="text-lg font-semibold" style={{ color: '#f8fafc' }}>
                          {server.gameType} - {server.uuid.substring(0, 8)}
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span style={{ color: '#cbd5e1' }}>Státusz: </span>
                          <span style={{ color: getStatusColor(server.status) }}>{server.status}</span>
                        </div>
                        <div>
                          <span style={{ color: '#cbd5e1' }}>Node: </span>
                          <span style={{ color: '#f8fafc' }}>{server.node?.name || server.nodeId}</span>
                        </div>
                        <div>
                          <span style={{ color: '#cbd5e1' }}>CPU: </span>
                          <span style={{ color: '#f8fafc' }}>{server.resources?.cpuLimit || 0} mag</span>
                        </div>
                        <div>
                          <span style={{ color: '#cbd5e1' }}>RAM: </span>
                          <span style={{ color: '#f8fafc' }}>{server.resources?.ramLimit || 0} MB</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/${locale}/dashboard/server/${server.uuid}`)}
                      >
                        Megtekintés
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

