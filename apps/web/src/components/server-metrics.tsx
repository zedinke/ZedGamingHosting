'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { apiClient } from '../lib/api-client';
import { useAuthStore } from '../stores/auth-store';

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

interface ServerMetricsProps {
  serverUuid: string;
  refreshInterval?: number;
}

export function ServerMetrics({ serverUuid, refreshInterval = 30000 }: ServerMetricsProps) {
  const t = useTranslations();
  const { accessToken } = useAuthStore();
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h');

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const from = new Date(now.getTime() - getTimeRangeMs(timeRange));

      const response = await apiClient.get<Metric[]>(
        `/servers/${serverUuid}/metrics?from=${from.toISOString()}&to=${now.toISOString()}&limit=100`
      );

      // Format data for charts
      const formattedMetrics = response.map((metric) => ({
        ...metric,
        timestamp: new Date(metric.timestamp).toLocaleTimeString(),
        networkInMB: Number(metric.networkIn) / (1024 * 1024),
        networkOutMB: Number(metric.networkOut) / (1024 * 1024),
      }));

      setMetrics(formattedMetrics);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    apiClient.setAccessToken(accessToken);
    loadMetrics();

    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        loadMetrics();
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [serverUuid, accessToken, timeRange, refreshInterval]);

  const getTimeRangeMs = (range: string): number => {
    switch (range) {
      case '1h':
        return 60 * 60 * 1000;
      case '6h':
        return 6 * 60 * 60 * 1000;
      case '24h':
        return 24 * 60 * 60 * 1000;
      case '7d':
        return 7 * 24 * 60 * 60 * 1000;
      default:
        return 60 * 60 * 1000;
    }
  };

  if (loading && metrics.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">{t('dashboard.server.metrics.loading') || 'Loading metrics...'}</p>
      </div>
    );
  }

  if (metrics.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">{t('dashboard.server.metrics.noData') || 'No metrics data available'}</p>
      </div>
    );
  }

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="rounded-lg p-3 border"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            borderColor: 'var(--color-border)',
          }}
        >
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-main)' }}>
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value?.toFixed(2)} {entry.dataKey.includes('Percent') || entry.dataKey === 'cpuUsage' ? '%' : entry.dataKey.includes('MB') ? 'MB' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex gap-2 justify-end">
        {(['1h', '6h', '24h', '7d'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              timeRange === range
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {range === '1h' ? '1 Hour' : range === '6h' ? '6 Hours' : range === '24h' ? '24 Hours' : '7 Days'}
          </button>
        ))}
      </div>

      {/* CPU Usage Chart */}
      <div
        className="rounded-lg p-6 border"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderColor: 'var(--color-border)',
        }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-main)' }}>
          {t('dashboard.server.metrics.cpu') || 'CPU Usage'}
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={metrics}>
            <defs>
              <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="timestamp"
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              domain={[0, 100]}
              label={{ value: '%', position: 'insideLeft', style: { fill: '#9ca3af' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="cpuUsage"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorCpu)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* RAM Usage Chart */}
      <div
        className="rounded-lg p-6 border"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderColor: 'var(--color-border)',
        }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-main)' }}>
          {t('dashboard.server.metrics.ram') || 'RAM Usage'}
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={metrics}>
            <defs>
              <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="timestamp"
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              domain={[0, 100]}
              label={{ value: '%', position: 'insideLeft', style: { fill: '#9ca3af' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="ramUsagePercent"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorRam)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Disk Usage Chart */}
      <div
        className="rounded-lg p-6 border"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderColor: 'var(--color-border)',
        }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-main)' }}>
          {t('dashboard.server.metrics.disk') || 'Disk Usage'}
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={metrics}>
            <defs>
              <linearGradient id="colorDisk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="timestamp"
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              domain={[0, 100]}
              label={{ value: '%', position: 'insideLeft', style: { fill: '#9ca3af' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="diskUsagePercent"
              stroke="#f59e0b"
              fillOpacity={1}
              fill="url(#colorDisk)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Network Usage Chart */}
      <div
        className="rounded-lg p-6 border"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderColor: 'var(--color-border)',
        }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-main)' }}>
          {t('dashboard.server.metrics.network') || 'Network Usage'}
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={metrics}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="timestamp"
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              label={{ value: 'MB', position: 'insideLeft', style: { fill: '#9ca3af' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="networkInMB"
              stroke="#8b5cf6"
              name={t('dashboard.server.metrics.networkIn') || 'In'}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="networkOutMB"
              stroke="#ec4899"
              name={t('dashboard.server.metrics.networkOut') || 'Out'}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

