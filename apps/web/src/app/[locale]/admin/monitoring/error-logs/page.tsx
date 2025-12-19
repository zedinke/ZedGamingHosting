'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useAuthStore } from '../../../../stores/auth-store';
import { Card, Button, Input } from '@zed-hosting/ui-kit';
import { apiClient } from '../../../../lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { useNotificationContext } from '../../../../context/notification-context';
import { AdminLayout } from '../../../../components/admin/admin-layout';
import { AlertTriangle, AlertCircle, AlertOctagon, Info, Download, RefreshCw } from 'lucide-react';

interface ErrorLog {
  id: string;
  message: string;
  context?: string;
  severity: string;
  userId?: string;
  url: string;
  source: string;
  userAgent: string;
  timestamp: string;
}

interface LogStats {
  totalErrors: number;
  recentErrors: number;
  bySeverity: Array<{ severity: string; count: number }>;
  byContext: Array<{ context: string; count: number }>;
  topUsers: Array<{ userId: string; errorCount: number }>;
}

export default function AdminErrorLogsPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const notifications = useNotificationContext();
  const locale = (params.locale as string) || 'hu';
  const [isHydrated, setIsHydrated] = useState(false);
  const [page, setPage] = useState(1);
  const [severity, setSeverity] = useState('');
  const [context, setContext] = useState('');
  const [userId, setUserId] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(30);

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

    const userRole = user?.role?.toUpperCase();
    if (userRole !== 'ADMIN' && userRole !== 'SUPERADMIN' && userRole !== 'SUPER_ADMIN') {
      router.push(`/${locale}/dashboard`);
    }
  }, [isAuthenticated, isHydrated, router, locale, user]);

  const { data: logs, isLoading: isLoadingLogs, refetch: refetchLogs } = useQuery({
    queryKey: ['admin-error-logs', page, severity, context, userId],
    queryFn: async () => {
      return await apiClient.post<any>('/logs/errors/search', {
        severity: severity || undefined,
        context: context || undefined,
        userId: userId || undefined,
        limit: 20,
        offset: (page - 1) * 20,
      });
    },
    enabled: isHydrated && isAuthenticated && !!accessToken,
    refetchInterval: refreshInterval * 1000,
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['admin-error-logs-stats'],
    queryFn: async () => {
      return await apiClient.post<LogStats>('/logs/stats', {});
    },
    enabled: isHydrated && isAuthenticated && !!accessToken,
    refetchInterval: refreshInterval * 1000,
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertOctagon className="h-5 w-5 text-red-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'error':
        return 'bg-orange-50 border-orange-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const handleExportCSV = async () => {
    if (!logs?.logs) return;

    const csv = [
      ['Dátum', 'Üzenet', 'Kontextus', 'Súlyosság', 'Felhasználó', 'URL', 'Forrás'],
      ...logs.logs.map(log => [
        new Date(log.timestamp).toLocaleString('hu-HU'),
        log.message,
        log.context || '-',
        log.severity,
        log.userId || '-',
        log.url,
        log.source,
      ]),
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `error_logs_${new Date().toISOString()}.csv`);
    link.click();
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-surface">
        <p className="text-text-muted">Betöltés...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-surface">
        <p className="text-text-muted">Átirányítás...</p>
      </div>
    );
  }

  return (
    <div className="light">
      <AdminLayout title="Rendszer Hibák">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-text-muted">Rendszer hibák monitorozása és elemzése</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  refetchLogs();
                }}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Frissítés
              </Button>
              <Button
                variant="secondary"
                onClick={handleExportCSV}
                className="flex items-center gap-2"
                disabled={!logs?.logs?.length}
              >
                <Download className="h-4 w-4" />
                Exportálás
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="p-6">
                <p className="text-text-muted text-sm">Összes hiba</p>
                <p className="text-3xl font-bold text-text-primary mt-2">
                  {stats.totalErrors}
                </p>
              </Card>
              <Card className="p-6">
                <p className="text-text-muted text-sm">Utolsó 1 órában</p>
                <p className="text-3xl font-bold text-text-primary mt-2">
                  {stats.recentErrors}
                </p>
              </Card>
              <Card className="p-6">
                <p className="text-text-muted text-sm">Kritikus hibák</p>
                <p className="text-3xl font-bold text-red-500 mt-2">
                  {stats.bySeverity.find(s => s.severity === 'critical')?.count || 0}
                </p>
              </Card>
              <Card className="p-6">
                <p className="text-text-muted text-sm">Érték hiba</p>
                <p className="text-3xl font-bold text-orange-500 mt-2">
                  {stats.bySeverity.find(s => s.severity === 'error')?.count || 0}
                </p>
              </Card>
            </div>
          )}

          {/* Filters */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Szűrők</h2>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Súlyosság
                </label>
                <select
                  value={severity}
                  onChange={(e) => {
                    setSeverity(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 bg-background-surface border border-border rounded-lg text-text-primary"
                >
                  <option value="">Összes</option>
                  <option value="critical">Kritikus</option>
                  <option value="error">Hiba</option>
                  <option value="warning">Figyelmeztetés</option>
                  <option value="info">Információ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Kontextus
                </label>
                <Input
                  type="text"
                  placeholder="pl. auth-error"
                  value={context}
                  onChange={(e) => {
                    setContext(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Felhasználó ID
                </label>
                <Input
                  type="text"
                  placeholder="Felhasználó ID"
                  value={userId}
                  onChange={(e) => {
                    setUserId(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Frissítési intervallum
                </label>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-background-surface border border-border rounded-lg text-text-primary"
                >
                  <option value={0}>Nincs</option>
                  <option value={10}>10 másodperc</option>
                  <option value={30}>30 másodperc</option>
                  <option value={60}>1 perc</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Error Logs Table */}
          {isLoadingLogs ? (
            <Card className="p-12 text-center">
              <p className="text-text-muted">Betöltés...</p>
            </Card>
          ) : !logs?.logs?.length ? (
            <Card className="p-12 text-center">
              <p className="text-text-muted">Nincs naplóbejegyzés a szűrési feltételeknek megfelelően</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {logs.logs.map((log) => (
                <Card
                  key={log.id}
                  className={`p-6 border-l-4 ${getSeverityColor(log.severity)}`}
                >
                  <div className="flex items-start gap-4">
                    {getSeverityIcon(log.severity)}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-text-primary">
                            {log.message}
                          </p>
                          {log.context && (
                            <p className="text-sm text-text-muted">
                              Kontextus: {log.context}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-text-muted px-2 py-1 bg-background-surface rounded">
                          {new Date(log.timestamp).toLocaleString('hu-HU')}
                        </span>
                      </div>

                      <div className="grid gap-2 text-sm text-text-muted mt-3">
                        {log.userId && (
                          <p>Felhasználó: <span className="font-mono">{log.userId}</span></p>
                        )}
                        <p>URL: <span className="font-mono text-xs break-all">{log.url}</span></p>
                        <p>Forrás: <span className="font-mono">{log.source}</span></p>
                        {log.userAgent && (
                          <p>User Agent: <span className="font-mono text-xs">{log.userAgent.substring(0, 80)}...</span></p>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              {/* Pagination */}
              {logs.pagination?.pages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <Button
                    variant="secondary"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Előző
                  </Button>
                  <span className="text-text-primary">
                    {page} / {logs.pagination.pages}
                  </span>
                  <Button
                    variant="secondary"
                    disabled={page === logs.pagination.pages}
                    onClick={() => setPage(page + 1)}
                  >
                    Következő
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </AdminLayout>
    </div>
  );
}
