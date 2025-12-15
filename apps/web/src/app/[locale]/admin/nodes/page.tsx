'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useAuthStore } from '../../../../stores/auth-store';
import { AdminLayout } from '../../../../components/admin/admin-layout';
import { Card, Button, Input, Badge } from '@zed-hosting/ui-kit';
import { apiClient } from '../../../../lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { css } from '../../../../styled-system/css';

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
      <div className={css({ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg-surface)' })}>
        <p className={css({ color: 'var(--color-text-muted)' })}>Betöltés...</p>
      </div>
    );
  }

  const userRole = currentUser?.role?.toUpperCase();
  if (!isAuthenticated || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'SUPERADMIN' && userRole !== 'RESELLER_ADMIN')) {
    return (
      <div className={css({ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg-surface)' })}>
        <p className={css({ color: 'var(--color-text-muted)' })}>Átirányítás...</p>
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

  const actions = (
    <Button variant="primary" onClick={() => router.push(`/${locale}/admin/nodes/create`)}>
      <Plus className={css({ height: '1rem', width: '1rem', marginRight: '0.5rem', display: 'inline' })} />
      Új node
    </Button>
  );

  return (
    <div>
      <AdminLayout title="Node-ok" actions={actions}>
        <div>
          <div className={css({ marginBottom: '1.5rem' })}>
            <p className={css({ color: 'var(--color-text-muted)' })}>
              Szerver node-ok kezelése és monitorozása
            </p>
          </div>

          <div className={css({ display: 'flex', gap: '1rem', marginBottom: '1.5rem' })}>
            <div className={css({ flex: 1, position: 'relative' })}>
              <Search className={css({ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', height: '1rem', width: '1rem', color: 'var(--color-text-muted)' })} />
              <Input
                type="text"
                placeholder="Keresés név, IP vagy FQDN alapján..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={css({ paddingLeft: '2.5rem' })}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={css({ paddingX: '1rem', paddingY: '0.5rem', borderRadius: '0.5rem', borderWidth: '1px', fontSize: 'sm', backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text-main)' })}
            >
              <option value="all">Minden státusz</option>
              <option value="ONLINE">ONLINE</option>
              <option value="OFFLINE">OFFLINE</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
              <option value="PROVISIONING">PROVISIONING</option>
            </select>
          </div>

          {isLoading ? (
            <div className={css({ textAlign: 'center', paddingY: '3rem' })}>
              <p className={css({ color: 'var(--color-text-muted)' })}>Betöltés...</p>
            </div>
          ) : !filteredNodes || filteredNodes.length === 0 ? (
            <Card className={css({ padding: '3rem', textAlign: 'center' })}>
              <p className={css({ color: 'var(--color-text-muted)' })}>
                {searchQuery || statusFilter !== 'all' ? 'Nincs találat' : 'Nincs node'}
              </p>
            </Card>
          ) : (
            <div className={css({ display: 'grid', gridTemplateColumns: { base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: '1.5rem' })}>
              {filteredNodes.map((node) => (
                <Card key={node.id} className={css({ padding: '1.5rem' })}>
                  <div className={css({ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' })}>
                    <div className={css({ flex: 1 })}>
                      <h3 className={css({ fontSize: 'lg', fontWeight: 'semibold', marginBottom: '0.25rem', color: 'var(--color-text-main)' })}>
                        {node.name}
                      </h3>
                      <p className={css({ fontSize: 'sm', color: 'var(--color-text-muted)' })}>
                        {node.publicFqdn || node.ipAddress}
                      </p>
                    </div>
                    <Badge variant={getStatusVariant(node.status)} size="sm">
                      {node.status}
                    </Badge>
                  </div>
                  
                  <div className={css({ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: 'sm', marginBottom: '1rem' })}>
                    <div className={css({ display: 'flex', justifyContent: 'space-between' })}>
                      <span className={css({ color: 'var(--color-text-muted)' })}>CPU:</span>
                      <span className={css({ color: 'var(--color-text-main)' })}>{node.totalCpu} mag</span>
                    </div>
                    <div className={css({ display: 'flex', justifyContent: 'space-between' })}>
                      <span className={css({ color: 'var(--color-text-muted)' })}>RAM:</span>
                      <span className={css({ color: 'var(--color-text-main)' })}>{(node.totalRam / 1024).toFixed(1)} GB</span>
                    </div>
                    <div className={css({ display: 'flex', justifyContent: 'space-between' })}>
                      <span className={css({ color: 'var(--color-text-muted)' })}>Lemez:</span>
                      <span className={css({ color: 'var(--color-text-main)' })}>{node.diskType}</span>
                    </div>
                  </div>

                  <div className={css({ paddingTop: '1rem', borderTopWidth: '1px', borderColor: 'var(--color-border)' })}>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className={css({ width: '100%' })}
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

