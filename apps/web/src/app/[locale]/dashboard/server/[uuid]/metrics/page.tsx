'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from '@i18n/translations';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../../../lib/api-client';
import { useAuthStore } from '../../../../../../stores/auth-store';
import { Card } from '@zed-hosting/ui-kit';
import { Navigation } from '../../../../../../components/navigation';
import { ProtectedRoute } from '../../../../../../components/protected-route';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface MetricData {
  timestamp: string;
  cpuUsage: number;
  ramUsage: number;
  ramUsagePercent: number;
  diskUsage: number;
  diskUsagePercent: number;
  networkIn?: number;
  networkOut?: number;
}

export default function ServerMetricsPage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations();
  const { accessToken } = useAuthStore();
  const serverUuid = params?.uuid as string;
  const locale = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] || 'hu' : 'hu';

  useEffect(() => {
    if (accessToken) {
      apiClient.setAccessToken(accessToken);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!serverUuid) {
      router.push(`/${locale}/dashboard`);
    }
  }, [serverUuid, router, locale]);

  // Fetch server metrics
  const { data: server } = useQuery({
    queryKey: ['server', serverUuid],
    queryFn: async () => {
      const response = await apiClient.get<any>(`/servers/${serverUuid}`);
      return response;
    },
    enabled: !!accessToken && !!serverUuid,
    refetchInterval: 30000,
  });

  // Fetch metrics history
  const { data: metricsHistory, isLoading: metricsLoading } = useQuery<MetricData[]>({
    queryKey: ['server-metrics', serverUuid],
    queryFn: async () => {
      // Get metrics from the last 24 hours
      const to = new Date();
      const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
      
      const response = await apiClient.get<any[]>(
        `/servers/${serverUuid}/metrics?from=${from.toISOString()}&to=${to.toISOString()}&limit=100`
      );
      
      // Transform backend response to frontend format
      return response.map((metric: any) => ({
        timestamp: metric.timestamp || new Date().toISOString(),
        cpuUsage: metric.cpuUsage || 0,
        ramUsage: metric.ramUsage || 0,
        ramUsagePercent: metric.ramUsagePercent || 0,
        diskUsage: metric.diskUsage || 0,
        diskUsagePercent: metric.diskUsagePercent || 0,
        networkIn: metric.networkIn ? Number(metric.networkIn) : 0,
        networkOut: metric.networkOut ? Number(metric.networkOut) : 0,
      }));
    },
    enabled: !!accessToken && !!serverUuid,
    refetchInterval: 60000, // Refetch every minute
  });

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
  };

  const currentMetrics = server?.metrics?.[0] || {};

  return (
    <ProtectedRoute>
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
                  {t('dashboard.server.metrics.title', { defaultValue: 'Szerver Metrikák' })}
                </h1>
                <p style={{ color: '#cbd5e1' }}>
                  {t('dashboard.server.metrics.description', { defaultValue: 'Szerver teljesítmény és erőforrás használat' })}
                </p>
              </div>
              <button
                onClick={() => router.push(`/${locale}/dashboard/server/${serverUuid}`)}
                className="px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--color-bg-card)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-main)',
                }}
              >
                Vissza
              </button>
            </div>
          </header>

          {/* Current Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="glass elevation-2 p-6">
              <h3 className="text-sm mb-2" style={{ color: '#cbd5e1' }}>CPU Használat</h3>
              <p className="text-3xl font-bold" style={{ color: '#f8fafc' }}>
                {currentMetrics.cpuUsage?.toFixed(1) || '0'}%
              </p>
            </Card>
            <Card className="glass elevation-2 p-6">
              <h3 className="text-sm mb-2" style={{ color: '#cbd5e1' }}>RAM Használat</h3>
              <p className="text-3xl font-bold" style={{ color: '#f8fafc' }}>
                {currentMetrics.ramUsagePercent?.toFixed(1) || '0'}%
              </p>
              <p className="text-xs mt-1" style={{ color: '#cbd5e1' }}>
                {currentMetrics.ramUsage ? `${(currentMetrics.ramUsage / 1024).toFixed(1)} GB` : '0 GB'}
              </p>
            </Card>
            <Card className="glass elevation-2 p-6">
              <h3 className="text-sm mb-2" style={{ color: '#cbd5e1' }}>Lemez Használat</h3>
              <p className="text-3xl font-bold" style={{ color: '#f8fafc' }}>
                {currentMetrics.diskUsagePercent?.toFixed(1) || '0'}%
              </p>
              <p className="text-xs mt-1" style={{ color: '#cbd5e1' }}>
                {currentMetrics.diskUsage ? `${currentMetrics.diskUsage.toFixed(1)} GB` : '0 GB'}
              </p>
            </Card>
            <Card className="glass elevation-2 p-6">
              <h3 className="text-sm mb-2" style={{ color: '#cbd5e1' }}>Státusz</h3>
              <p className="text-3xl font-bold" style={{ 
                color: server?.status === 'RUNNING' ? '#10b981' : server?.status === 'STOPPED' ? '#6b7280' : '#f59e0b'
              }}>
                {server?.status || 'N/A'}
              </p>
            </Card>
          </div>

          {metricsLoading ? (
            <div className="text-center py-12">
              <p style={{ color: '#cbd5e1' }}>Metrikák betöltése...</p>
            </div>
          ) : metricsHistory && metricsHistory.length > 0 ? (
            <div className="space-y-6">
              {/* CPU Usage Chart */}
              <Card className="glass elevation-2 p-6">
                <h2 className="text-xl font-semibold mb-4" style={{ color: '#f8fafc' }}>CPU Használat</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metricsHistory}>
                    <defs>
                      <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={formatTime}
                      stroke="#9ca3af"
                    />
                    <YAxis 
                      domain={[0, 100]}
                      stroke="#9ca3af"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                      labelFormatter={(value) => formatTime(value)}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cpuUsage" 
                      stroke="#3b82f6" 
                      fillOpacity={1} 
                      fill="url(#colorCpu)"
                      name="CPU %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              {/* RAM Usage Chart */}
              <Card className="glass elevation-2 p-6">
                <h2 className="text-xl font-semibold mb-4" style={{ color: '#f8fafc' }}>RAM Használat</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metricsHistory}>
                    <defs>
                      <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={formatTime}
                      stroke="#9ca3af"
                    />
                    <YAxis 
                      domain={[0, 100]}
                      stroke="#9ca3af"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                      labelFormatter={(value) => formatTime(value)}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="ramUsagePercent" 
                      stroke="#10b981" 
                      fillOpacity={1} 
                      fill="url(#colorRam)"
                      name="RAM %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              {/* Disk Usage Chart */}
              <Card className="glass elevation-2 p-6">
                <h2 className="text-xl font-semibold mb-4" style={{ color: '#f8fafc' }}>Lemez Használat</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metricsHistory}>
                    <defs>
                      <linearGradient id="colorDisk" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={formatTime}
                      stroke="#9ca3af"
                    />
                    <YAxis 
                      domain={[0, 100]}
                      stroke="#9ca3af"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                      labelFormatter={(value) => formatTime(value)}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="diskUsagePercent" 
                      stroke="#f59e0b" 
                      fillOpacity={1} 
                      fill="url(#colorDisk)"
                      name="Lemez %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              {/* Network Usage Chart */}
              {metricsHistory[0]?.networkIn !== undefined && (
                <Card className="glass elevation-2 p-6">
                  <h2 className="text-xl font-semibold mb-4" style={{ color: '#f8fafc' }}>Hálózati Használat</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={metricsHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={formatTime}
                        stroke="#9ca3af"
                      />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                        labelFormatter={(value) => formatTime(value)}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="networkIn" 
                        stroke="#3b82f6" 
                        name="Bejövő (KB/s)"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="networkOut" 
                        stroke="#10b981" 
                        name="Kimenő (KB/s)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              )}
            </div>
          ) : (
            <Card className="glass elevation-2 p-12 text-center">
              <p style={{ color: '#cbd5e1' }}>
                Nincs elérhető metrika adat
              </p>
            </Card>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
