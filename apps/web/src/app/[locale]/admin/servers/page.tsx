'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../../stores/auth-store';
import { AdminLayout } from '../../../../components/admin/admin-layout';
import { Card, Button, Input, Badge } from '@zed-hosting/ui-kit';
import { useNotificationContext } from '../../../../context/notification-context';
import { apiClient } from '../../../../lib/api-client';
import { Search, Download, Trash2, ExternalLink, Eye } from 'lucide-react';
import { exportToCSV } from '../../../../utils/export';
import { BulkActions } from '../../../../components/bulk-actions';
import { Checkbox } from '../../../../components/checkbox';

interface Server {
  uuid: string;
  name: string;
  status: 'ONLINE' | 'OFFLINE' | 'CRASHED' | 'STARTING' | 'STOPPING';
  node: {
    name: string;
  };
  resources: {
    cpuLimit: number;
    ramLimit: number;
    diskLimit: number;
  };
  gameType: string;
  owner?: {
    email: string;
  };
}

export default function AdminServersPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'hu';
  const { user: currentUser, isAuthenticated, accessToken } = useAuthStore();
  const notifications = useNotificationContext();
  const [isHydrated, setIsHydrated] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedServers, setSelectedServers] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  useEffect(() => {
    setIsHydrated(true);
    if (accessToken) {
      apiClient.setAccessToken(accessToken);
    }
  }, [accessToken]);

  const { data: servers = [], isLoading } = useQuery<Server[]>({
    queryKey: ['admin-servers'],
    queryFn: async () => {
      const response = await apiClient.get<Server[]>('/admin/servers');
      return response;
    },
    enabled: !!accessToken && isAuthenticated,
    refetchInterval: 30000,
  });

  const deleteServerMutation = useMutation({
    mutationFn: async (uuid: string) => {
      await apiClient.delete(`/servers/${uuid}`);
    },
    onSuccess: (_, uuid) => {
      queryClient.invalidateQueries({ queryKey: ['admin-servers'] });
      notifications.addNotification({
        type: 'success',
        title: 'Szerver törölve',
        message: 'A szerver sikeresen törölve.',
      });
      setSelectedServers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(uuid);
        return newSet;
      });
    },
    onError: (err: any) => {
      notifications.addNotification({
        type: 'error',
        title: 'Hiba',
        message: err.message || 'A szerver törlése sikertelen volt.',
      });
    },
  });

  const handleDeleteServer = async (uuid: string) => {
    if (!window.confirm('Biztosan törölni szeretnéd ezt a szervert? Ez a művelet visszavonhatatlan.')) {
      return;
    }
    deleteServerMutation.mutate(uuid);
  };

  const handleBulkDelete = async (items: string[]) => {
    if (items.length === 0) return;
    await Promise.all(items.map(uuid => deleteServerMutation.mutateAsync(uuid)));
    setSelectedServers(new Set());
  };

  const filteredServers = servers.filter(server => {
    const matchesSearch = server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      server.gameType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      server.node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      server.owner?.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || server.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: servers.length,
    running: servers.filter(s => s.status === 'ONLINE').length,
    stopped: servers.filter(s => s.status === 'OFFLINE').length,
    crashed: servers.filter(s => s.status === 'CRASHED').length,
  };

  const handleExport = () => {
    const data = filteredServers.map(server => ({
      Név: server.name,
      Állapot: server.status,
      Játék: server.gameType,
      Node: server.node.name,
      CPU: server.resources.cpuLimit,
      RAM: `${server.resources.ramLimit} MB`,
      Disk: `${server.resources.diskLimit} GB`,
      Tulajdonos: server.owner?.email || 'N/A',
    }));
    exportToCSV(data, `admin-servers-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const toggleServerSelection = (uuid: string) => {
    setSelectedServers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(uuid)) {
        newSet.delete(uuid);
      } else {
        newSet.add(uuid);
      }
      return newSet;
    });
  };

  const toggleAllServers = () => {
    if (selectedServers.size === filteredServers.length) {
      setSelectedServers(new Set());
    } else {
      setSelectedServers(new Set(filteredServers.map(s => s.uuid)));
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-surface)' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Betöltés...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push(`/${locale}/login`);
    return null;
  }

  const userRole = currentUser?.role?.toUpperCase();
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'SUPERADMIN' || userRole === 'RESELLER_ADMIN';

  if (!isAdmin) {
    router.push(`/${locale}/dashboard`);
    return null;
  }

  const getStatusVariant = (status: string): 'success' | 'danger' | 'warning' | 'default' => {
    switch (status) {
      case 'ONLINE':
        return 'success';
      case 'OFFLINE':
        return 'default';
      case 'CRASHED':
        return 'danger';
      case 'STARTING':
      case 'STOPPING':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <div className="light">
      <AdminLayout title="Szerverek">
        <div>
          <div className="mb-6">
            <p style={{ color: 'var(--color-text-muted)' }}>
              Összes szerver kezelése és monitorozása
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>Összes szerver</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-text-main)' }}>{stats.total}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>Futó</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-success)' }}>{stats.running}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>Leállított</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-text-muted)' }}>{stats.stopped}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>Összeomlott</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-danger)' }}>{stats.crashed}</div>
            </Card>
          </div>

          {/* Filters and Actions */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
              <Input
                type="text"
                placeholder="Keresés szerver neve, játék típusa, node vagy tulajdonos szerint..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border text-sm"
              style={{
                backgroundColor: 'var(--color-bg-card)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-main)',
              }}
            >
              <option value="all">Összes állapot</option>
              <option value="ONLINE">Online</option>
              <option value="OFFLINE">Offline</option>
              <option value="CRASHED">Összeomlott</option>
              <option value="STARTING">Indítás</option>
              <option value="STOPPING">Leállítás</option>
            </select>
            <Button onClick={handleExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

        {/* Bulk Actions */}
        {selectedServers.size > 0 && (
          <BulkActions
            selectedItems={Array.from(selectedServers)}
            onDelete={handleBulkDelete}
          />
        )}

          {/* Servers Table */}
          <Card className="overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
                Betöltés...
              </div>
            ) : filteredServers.length === 0 ? (
              <div className="p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
                Nincs szerver
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                      <th className="px-4 py-3 text-left">
                        <Checkbox
                          checked={selectedServers.size === filteredServers.length && filteredServers.length > 0}
                          onChange={toggleAllServers}
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Név</th>
                      <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Állapot</th>
                      <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Játék</th>
                      <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Node</th>
                      <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Erőforrások</th>
                      <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Tulajdonos</th>
                      <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Műveletek</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredServers.map((server) => (
                      <tr
                        key={server.uuid}
                        className="border-b hover:bg-[var(--color-bg-hover)] transition-colors"
                        style={{ borderColor: 'var(--color-border)' }}
                      >
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={selectedServers.has(server.uuid)}
                            onChange={() => toggleServerSelection(server.uuid)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium" style={{ color: 'var(--color-text-main)' }}>{server.name}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={getStatusVariant(server.status)} size="sm">
                            {server.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{server.gameType}</td>
                        <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{server.node.name}</td>
                        <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>
                          <div className="text-xs">
                            <div>CPU: {server.resources.cpuLimit}</div>
                            <div>RAM: {server.resources.ramLimit} MB</div>
                            <div>Disk: {server.resources.diskLimit} GB</div>
                          </div>
                        </td>
                        <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>
                          {server.owner?.email || 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/${locale}/dashboard/server/${server.uuid}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/${locale}/dashboard/server/${server.uuid}?view=admin`)}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteServer(server.uuid)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </AdminLayout>
    </div>
  );
}
