'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useAuthStore } from '../../../../stores/auth-store';
import { AdminLayout } from '../../../../components/admin/admin-layout';
import { Card, Button } from '@zed-hosting/ui-kit';
import { apiClient } from '../../../../lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import { ListSkeleton } from '../../../../components/loading-skeleton';
import { Pagination } from '../../../../components/pagination';
import { BackButton } from '../../../../components/back-button';

interface Server {
  id: string;
  hostname: string;
  game: string;
  status: string;
  slots: number;
  ip: string;
  port: number;
  userId: string;
  createdAt: string;
  user?: {
    email: string;
  };
}

export default function ResellerServersPage() {
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
    if (isHydrated && isAuthenticated && userRole !== 'RESELLER_ADMIN') {
      router.push(`/${locale}/dashboard`);
      return;
    }
  }, [isAuthenticated, isHydrated, currentUser, router, locale]);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: servers, isLoading } = useQuery<Server[]>({
    queryKey: ['reseller-servers'],
    queryFn: async () => {
      // Ez később lehet saját endpoint
      return await apiClient.get<Server[]>('/admin/servers');
    },
    enabled: isHydrated && isAuthenticated && !!accessToken,
  });

  const filteredServers = servers?.filter((server) => {
    const matchesStatus = statusFilter === 'all' || server.status === statusFilter;
    return matchesStatus;
  }) || [];

  const totalPages = Math.ceil(filteredServers.length / itemsPerPage);
  const paginatedServers = filteredServers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-surface">
        <p className="text-text-muted">Betöltés...</p>
      </div>
    );
  }

  const userRole = currentUser?.role?.toUpperCase();
  if (!isAuthenticated || userRole !== 'RESELLER_ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-surface">
        <p className="text-text-muted">Átirányítás...</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'RUNNING':
        return 'bg-green-100 text-green-800';
      case 'STOPPED':
        return 'bg-red-100 text-red-800';
      case 'PROVISIONING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout title="Reseller Szerverek">
      <div>
        <div className="mb-4 flex justify-end">
          <BackButton fallbackHref={`/${locale}/reseller`} />
        </div>
        <div className="mb-6">
          <p className="text-text-muted">
            Reseller szerverinek kezelése
          </p>
        </div>

        <div className="mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-border text-sm bg-background-card text-text-primary"
          >
            <option value="all">Minden státusz</option>
            <option value="RUNNING">Futó</option>
            <option value="STOPPED">Leállított</option>
            <option value="PROVISIONING">Telepítés alatt</option>
          </select>
        </div>

        {isLoading ? (
          <ListSkeleton items={5} />
        ) : filteredServers.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-text-muted">
              {statusFilter !== 'all' ? 'Nincs találat' : 'Nincs szerver'}
            </p>
          </Card>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {paginatedServers.map((server) => (
                <Card key={server.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-lg font-semibold text-text-primary">
                          {server.hostname}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(server.status)}`}>
                          {server.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-text-muted">Játék</p>
                          <p className="text-text-primary font-medium">{server.game}</p>
                        </div>
                        <div>
                          <p className="text-text-muted">IP:Port</p>
                          <p className="text-text-primary font-medium">{server.ip}:{server.port}</p>
                        </div>
                        <div>
                          <p className="text-text-muted">Slotok</p>
                          <p className="text-text-primary font-medium">{server.slots}</p>
                        </div>
                        <div>
                          <p className="text-text-muted">Tulajdonos</p>
                          <p className="text-text-primary font-medium">{server.user?.email || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/${locale}/admin/servers/${server.id}`)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
