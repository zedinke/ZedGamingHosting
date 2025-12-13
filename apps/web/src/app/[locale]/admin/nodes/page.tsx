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

interface Node {
  id: string;
  name: string;
  ipAddress: string;
  publicFqdn?: string;
  totalRam: number;
  totalCpu: number;
  diskType: string;
  status: string;
  lastHeartbeat?: string;
}

export default function AdminNodesPage() {
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

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: nodes, isLoading, refetch } = useQuery<Node[]>({
    queryKey: ['admin-nodes'],
    queryFn: async () => {
      return await apiClient.get<Node[]>('/nodes');
    },
    enabled: isHydrated && isAuthenticated && !!accessToken,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const filteredNodes = nodes?.filter((node) => {
    const matchesSearch = !searchQuery || 
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.ipAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (node.publicFqdn && node.publicFqdn.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || node.status === statusFilter;
    return matchesSearch && matchesStatus;
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
      case 'ONLINE':
        return '#10b981';
      case 'OFFLINE':
        return '#ef4444';
      case 'MAINTENANCE':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

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
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2" style={{ color: '#f8fafc' }}>Node-ok</h1>
                <p style={{ color: '#cbd5e1' }}>
                  Szerver node-ok kezelése és monitorozása
                </p>
              </div>
              <Button variant="primary" onClick={() => router.push(`/${locale}/admin/nodes/create`)}>
                Új node
              </Button>
            </div>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Keresés név, IP vagy FQDN alapján..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--color-bg-card)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-main)',
                }}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--color-bg-card)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-main)',
                }}
              >
                <option value="all">Minden státusz</option>
                <option value="ONLINE">ONLINE</option>
                <option value="OFFLINE">OFFLINE</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="PROVISIONING">PROVISIONING</option>
              </select>
            </div>
          </header>

          {isLoading ? (
            <div className="text-center py-12">
              <p style={{ color: '#cbd5e1' }}>Betöltés...</p>
            </div>
          ) : !filteredNodes || filteredNodes.length === 0 ? (
            <Card className="glass elevation-2 p-12 text-center">
              <p style={{ color: '#cbd5e1' }}>
                {searchQuery || statusFilter !== 'all' ? 'Nincs találat' : 'Nincs node'}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNodes.map((node) => (
                <Card key={node.id} className="glass elevation-2 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1" style={{ color: '#f8fafc' }}>
                        {node.name}
                      </h3>
                      <p className="text-sm" style={{ color: '#cbd5e1' }}>
                        {node.publicFqdn || node.ipAddress}
                      </p>
                    </div>
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getStatusColor(node.status) }}
                      title={node.status}
                    />
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: '#cbd5e1' }}>CPU:</span>
                      <span style={{ color: '#f8fafc' }}>{node.totalCpu} mag</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#cbd5e1' }}>RAM:</span>
                      <span style={{ color: '#f8fafc' }}>{(node.totalRam / 1024).toFixed(1)} GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#cbd5e1' }}>Lemez:</span>
                      <span style={{ color: '#f8fafc' }}>{node.diskType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#cbd5e1' }}>Státusz:</span>
                      <span style={{ color: getStatusColor(node.status) }}>{node.status}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => router.push(`/${locale}/admin/nodes/${node.id}`)}
                      >
                        Szerkesztés
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

