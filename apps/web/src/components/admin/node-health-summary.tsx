'use client';

import { Card, Badge } from '@zed-hosting/ui-kit';
import { Activity, AlertTriangle, CheckCircle2, Server, XCircle } from 'lucide-react';

interface Node {
  id: string;
  status: string;
  totalRam: number;
  totalCpu: number;
  lastHeartbeat?: string;
}

interface NodeHealthSummaryProps {
  nodes?: Node[];
}

export function NodeHealthSummary({ nodes = [] }: NodeHealthSummaryProps) {
  const totalNodes = nodes.length;
  const onlineNodes = nodes.filter((n) => n.status === 'ONLINE').length;
  const offlineNodes = nodes.filter((n) => n.status === 'OFFLINE').length;
  const maintenanceNodes = nodes.filter((n) => n.status === 'MAINTENANCE').length;

  // Calculate stale heartbeats (>30 min)
  const staleNodes = nodes.filter((n) => {
    if (!n.lastHeartbeat) return true;
    const diffMs = Date.now() - new Date(n.lastHeartbeat).getTime();
    return diffMs > 30 * 60 * 1000;
  }).length;

  // Calculate total resources
  const totalCpu = nodes.reduce((sum, n) => sum + n.totalCpu, 0);
  const totalRamGb = nodes.reduce((sum, n) => sum + n.totalRam, 0) / 1024;

  const stats = [
    {
      label: 'Összes node',
      value: totalNodes,
      icon: Server,
      color: 'text-blue-500',
    },
    {
      label: 'Online',
      value: onlineNodes,
      icon: CheckCircle2,
      color: 'text-green-500',
    },
    {
      label: 'Offline',
      value: offlineNodes,
      icon: XCircle,
      color: 'text-red-500',
    },
    {
      label: 'Karbantartás',
      value: maintenanceNodes,
      icon: Activity,
      color: 'text-yellow-500',
    },
  ];

  const healthScore = totalNodes > 0 ? Math.round((onlineNodes / totalNodes) * 100) : 0;
  const isHealthy = healthScore >= 80;
  const isWarning = healthScore >= 50 && healthScore < 80;

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-text-main flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Node Health Összesítő
          </h3>
          <Badge
            variant={isHealthy ? 'success' : isWarning ? 'warning' : 'danger'}
            size="sm"
          >
            {healthScore}% Elérhető
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-background-surface mb-2 ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="text-2xl font-bold text-text-main">{stat.value}</div>
              <div className="text-sm text-text-muted">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
          <div className="text-center">
            <div className="text-sm text-text-muted mb-1">Összes CPU</div>
            <div className="text-xl font-semibold text-text-main">{totalCpu} mag</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-text-muted mb-1">Összes RAM</div>
            <div className="text-xl font-semibold text-text-main">{totalRamGb.toFixed(1)} GB</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-text-muted mb-1">Lejárt jelzés</div>
            <div className="flex items-center justify-center gap-2">
              <div className="text-xl font-semibold text-text-main">{staleNodes}</div>
              {staleNodes > 0 && (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
