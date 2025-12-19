'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useAuthStore } from '../../../../stores/auth-store';
import { AdminLayout } from '../../../../components/admin/admin-layout';
import { NodeHealthSummary } from '../../../../components/admin/node-health-summary';
import { Card, Button, Input, Badge } from '@zed-hosting/ui-kit';
import { apiClient } from '../../../../lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';

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

  const { data: nodes, isLoading } = useQuery<Node[]>({
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
      <div className="min-h-screen flex items-center justify-center bg-background-surface">
        <p className="text-text-muted">Betöltés...</p>
      </div>
    );
  }

  const userRole = currentUser?.role?.toUpperCase();
  if (!isAuthenticated || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'SUPERADMIN' && userRole !== 'RESELLER_ADMIN')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-surface">
        <p className="text-text-muted">Átirányítás...</p>
      </div>
    );
  }

  const getStatusVariant = (status: string): 'success' | 'danger' | 'warning' | 'default' => {
    switch (status) {
      case 'ONLINE':
        return 'success';
      case 'OFFLINE':
        return 'danger';
      case 'MAINTENANCE':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatHeartbeat = (iso?: string): { text: string; variant: 'success' | 'warning' | 'danger' | 'default'; title?: string } => {
    if (!iso) {
      return { text: 'nincs adat', variant: 'default' };
    }
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.max(0, Math.floor(diffMs / 1000));
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    let text: string;
    if (diffDay > 0) text = `${diffDay} napja`;
    else if (diffHour > 0) text = `${diffHour} órája`;
    else if (diffMin > 0) text = `${diffMin} perce`;
    else text = `${diffSec} mp`;

    // Heurisztika a jelzés frissességére
    let variant: 'success' | 'warning' | 'danger' | 'default' = 'default';
    if (diffMin <= 1) variant = 'success';
    else if (diffMin <= 10) variant = 'default';
    else if (diffMin <= 30) variant = 'warning';
    else variant = 'danger';

    return { text, variant, title: date.toLocaleString() };
  };

  const actions = (
    <Button variant="primary" onClick={() => router.push(`/${locale}/admin/nodes/create`)}>
      <Plus className="h-4 w-4 mr-2 inline" />
      Új node
    </Button>
  );

  return (
    <div>
      <AdminLayout title="Node-ok" actions={actions}>
        <div>
          <div className="mb-6">
            <p className="text-text-muted">
              Szerver node-ok kezelése és monitorozása
            </p>
          </div>

          <NodeHealthSummary nodes={nodes} />

          <div className="flex gap-4 mb-6 mt-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                type="text"
                placeholder="Keresés név, IP vagy FQDN alapján..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-border text-sm bg-background-card text-text-main"
            >
              <option value="all">Minden státusz</option>
              <option value="ONLINE">ONLINE</option>
              <option value="OFFLINE">OFFLINE</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
              <option value="PROVISIONING">PROVISIONING</option>
            </select>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-text-muted">Betöltés...</p>
            </div>
          ) : !filteredNodes || filteredNodes.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-text-muted">
                {searchQuery || statusFilter !== 'all' ? 'Nincs találat' : 'Nincs node'}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNodes.map((node) => (
                <Card key={node.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1 text-text-main">
                        {node.name}
                      </h3>
                      <p className="text-sm text-text-muted">
                        {node.publicFqdn || node.ipAddress}
                      </p>
                    </div>
                    <Badge variant={getStatusVariant(node.status)} size="sm">
                      {node.status}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-col gap-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-text-muted">CPU:</span>
                      <span className="text-text-main">{node.totalCpu} mag</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">RAM:</span>
                      <span className="text-text-main">{(node.totalRam / 1024).toFixed(1)} GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Lemez:</span>
                      <span className="text-text-main">{node.diskType}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-muted">Utolsó jelzés:</span>
                      {(() => {
                        const hb = formatHeartbeat(node.lastHeartbeat);
                        return (
                          <span title={hb.title} className="flex items-center gap-2">
                            <Badge variant={hb.variant} size="sm">{hb.text}</Badge>
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border flex gap-2">
                    <Button 
                      variant="primary" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => router.push(`/${locale}/admin/nodes/${node.id}/health`)}
                    >
                      Részletek
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => router.push(`/${locale}/admin/nodes/${node.id}`)}
                    >
                      Szerkesztés
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </AdminLayout>
    </div>
  );
}

