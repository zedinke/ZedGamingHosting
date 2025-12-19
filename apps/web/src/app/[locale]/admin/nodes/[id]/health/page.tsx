'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useAuthStore } from '../../../../../../stores/auth-store';
import { AdminLayout } from '../../../../../../components/admin/admin-layout';
import { Card, Button, Badge } from '@zed-hosting/ui-kit';
import { apiClient } from '../../../../../../lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Activity, 
  Cpu, 
  HardDrive, 
  Network, 
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Settings
} from 'lucide-react';

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

interface Metric {
  id: string;
  timestamp: string;
  cpuUsage: number;
  ramUsage: number;
  ramUsagePercent: number;
  diskUsage: number;
  diskUsagePercent: number;
  networkIn: number;
  networkOut: number;
  uptime?: number;
}

interface GameServer {
  uuid: string;
  name: string;
  status: string;
  gameType: string;
}

export default function NodeHealthPage() {
  const router = useRouter();
  const params = useParams();
  const { user: currentUser, isAuthenticated, accessToken } = useAuthStore();
  const locale = (params.locale as string) || 'hu';
  const nodeId = params.id as string;
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

  const { data: node, isLoading: nodeLoading } = useQuery<Node>({
    queryKey: ['admin-node', nodeId],
    queryFn: async () => {
      return await apiClient.get<Node>(`/nodes/${nodeId}`);
    },
    enabled: isHydrated && isAuthenticated && !!accessToken && !!nodeId,
    refetchInterval: 15000,
  });

  const { data: latestMetric } = useQuery<Metric>({
    queryKey: ['node-latest-metric', nodeId],
    queryFn: async () => {
      const metrics = await apiClient.get<Metric[]>(`/metrics/node/${nodeId}?limit=1`);
      return metrics[0];
    },
    enabled: isHydrated && isAuthenticated && !!accessToken && !!nodeId,
    refetchInterval: 10000,
  });

  const { data: servers } = useQuery<GameServer[]>({
    queryKey: ['node-servers', nodeId],
    queryFn: async () => {
      return await apiClient.get<GameServer[]>(`/servers?nodeId=${nodeId}`);
    },
    enabled: isHydrated && isAuthenticated && !!accessToken && !!nodeId,
    refetchInterval: 30000,
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

    let variant: 'success' | 'warning' | 'danger' | 'default' = 'default';
    if (diffMin <= 1) variant = 'success';
    else if (diffMin <= 10) variant = 'default';
    else if (diffMin <= 30) variant = 'warning';
    else variant = 'danger';

    return { text, variant, title: date.toLocaleString() };
  };

  const formatUptime = (seconds?: number): string => {
    if (!seconds) return 'N/A';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}n ${hours}ó ${mins}p`;
    if (hours > 0) return `${hours}ó ${mins}p`;
    return `${mins}p`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const actions = (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => router.push(`/${locale}/admin/nodes`)}>
        <ArrowLeft className="h-4 w-4 mr-2 inline" />
        Vissza
      </Button>
      <Button variant="primary" onClick={() => router.push(`/${locale}/admin/nodes/${nodeId}`)}>
        <Settings className="h-4 w-4 mr-2 inline" />
        Szerkesztés
      </Button>
    </div>
  );

  if (nodeLoading || !node) {
    return (
      <div>
        <AdminLayout title="Node részletek" actions={actions}>
          <div className="text-center py-12">
            <p className="text-text-muted">Betöltés...</p>
          </div>
        </AdminLayout>
      </div>
    );
  }

  const hb = formatHeartbeat(node.lastHeartbeat);
  const isNodeHealthy = node.status === 'ONLINE' && hb.variant === 'success';
  
  // Calculate alerts
  const alerts: { severity: 'critical' | 'warning' | 'info'; message: string }[] = [];
  
  if (node.status === 'OFFLINE') {
    alerts.push({ severity: 'critical', message: 'Node OFFLINE állapotban' });
  }
  
  if (hb.variant === 'danger') {
    alerts.push({ severity: 'warning', message: `Utolsó jelzés ${hb.text}` });
  }
  
  if (latestMetric) {
    if (latestMetric.cpuUsage > 90) {
      alerts.push({ severity: 'critical', message: `CPU használat ${latestMetric.cpuUsage.toFixed(1)}%` });
    } else if (latestMetric.cpuUsage > 80) {
      alerts.push({ severity: 'warning', message: `CPU használat ${latestMetric.cpuUsage.toFixed(1)}%` });
    }
    
    if (latestMetric.ramUsagePercent > 90) {
      alerts.push({ severity: 'critical', message: `RAM használat ${latestMetric.ramUsagePercent.toFixed(1)}%` });
    } else if (latestMetric.ramUsagePercent > 80) {
      alerts.push({ severity: 'warning', message: `RAM használat ${latestMetric.ramUsagePercent.toFixed(1)}%` });
    }
    
    if (latestMetric.diskUsagePercent > 90) {
      alerts.push({ severity: 'critical', message: `Disk használat ${latestMetric.diskUsagePercent.toFixed(1)}%` });
    } else if (latestMetric.diskUsagePercent > 80) {
      alerts.push({ severity: 'warning', message: `Disk használat ${latestMetric.diskUsagePercent.toFixed(1)}%` });
    }
  }

  return (
    <div>
      <AdminLayout title={`Node: ${node.name}`} actions={actions}>
        <div className="space-y-6">
          {/* Status Overview */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-text-main mb-2">{node.name}</h2>
                <p className="text-text-muted">{node.publicFqdn || node.ipAddress}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={getStatusVariant(node.status)} size="lg">
                  {node.status}
                </Badge>
                <Badge variant={hb.variant} size="sm" title={hb.title}>
                  Jelzés: {hb.text}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-sm text-text-muted mb-1">CPU</div>
                <div className="text-xl font-semibold text-text-main">{node.totalCpu} mag</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-text-muted mb-1">RAM</div>
                <div className="text-xl font-semibold text-text-main">{(node.totalRam / 1024).toFixed(1)} GB</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-text-muted mb-1">Lemez típus</div>
                <div className="text-xl font-semibold text-text-main">{node.diskType}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-text-muted mb-1">Uptime</div>
                <div className="text-xl font-semibold text-text-main">{formatUptime(latestMetric?.uptime)}</div>
              </div>
            </div>
          </Card>

          {/* Alerts */}
          {alerts.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-text-main mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Riasztások ({alerts.length})
              </h3>
              <div className="space-y-2">
                {alerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      alert.severity === 'critical'
                        ? 'bg-red-500/10 border border-red-500/20'
                        : alert.severity === 'warning'
                        ? 'bg-yellow-500/10 border border-yellow-500/20'
                        : 'bg-blue-500/10 border border-blue-500/20'
                    }`}
                  >
                    {alert.severity === 'critical' ? (
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    ) : alert.severity === 'warning' ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    )}
                    <span className="text-text-main">{alert.message}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Current Metrics */}
          {latestMetric ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-text-muted">CPU Használat</h3>
                  <Cpu className="h-5 w-5 text-blue-500" />
                </div>
                <div className="text-3xl font-bold text-text-main mb-2">
                  {latestMetric.cpuUsage.toFixed(1)}%
                </div>
                <div className="w-full bg-background-surface rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      latestMetric.cpuUsage > 90
                        ? 'bg-red-500'
                        : latestMetric.cpuUsage > 80
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(latestMetric.cpuUsage, 100)}%` }}
                  />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-text-muted">RAM Használat</h3>
                  <Activity className="h-5 w-5 text-purple-500" />
                </div>
                <div className="text-3xl font-bold text-text-main mb-2">
                  {latestMetric.ramUsagePercent.toFixed(1)}%
                </div>
                <div className="text-sm text-text-muted mb-2">
                  {(latestMetric.ramUsage / 1024).toFixed(1)} / {(node.totalRam / 1024).toFixed(1)} GB
                </div>
                <div className="w-full bg-background-surface rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      latestMetric.ramUsagePercent > 90
                        ? 'bg-red-500'
                        : latestMetric.ramUsagePercent > 80
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(latestMetric.ramUsagePercent, 100)}%` }}
                  />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-text-muted">Disk Használat</h3>
                  <HardDrive className="h-5 w-5 text-orange-500" />
                </div>
                <div className="text-3xl font-bold text-text-main mb-2">
                  {latestMetric.diskUsagePercent.toFixed(1)}%
                </div>
                <div className="text-sm text-text-muted mb-2">
                  {latestMetric.diskUsage.toFixed(1)} GB használva
                </div>
                <div className="w-full bg-background-surface rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      latestMetric.diskUsagePercent > 90
                        ? 'bg-red-500'
                        : latestMetric.diskUsagePercent > 80
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(latestMetric.diskUsagePercent, 100)}%` }}
                  />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-text-muted">Hálózat</h3>
                  <Network className="h-5 w-5 text-green-500" />
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="text-sm text-text-muted">Bejövő</div>
                    <div className="text-lg font-semibold text-text-main">
                      {formatBytes(Number(latestMetric.networkIn))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-text-muted">Kimenő</div>
                    <div className="text-lg font-semibold text-text-main">
                      {formatBytes(Number(latestMetric.networkOut))}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-text-muted">Nincs elérhető metrika adat</p>
            </Card>
          )}

          {/* Running Servers */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-text-main mb-4">
              Futó szerverek ({servers?.length || 0})
            </h3>
            {servers && servers.length > 0 ? (
              <div className="space-y-2">
                {servers.map((server) => (
                  <div
                    key={server.uuid}
                    className="flex items-center justify-between p-3 rounded-lg bg-background-surface"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-text-main">{server.name}</div>
                      <div className="text-sm text-text-muted">{server.gameType}</div>
                    </div>
                    <Badge
                      variant={
                        server.status === 'RUNNING'
                          ? 'success'
                          : server.status === 'STOPPED'
                          ? 'default'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {server.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-text-muted py-4">Nincs futó szerver</p>
            )}
          </Card>
        </div>
      </AdminLayout>
    </div>
  );
}
