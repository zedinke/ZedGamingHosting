'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../../../../lib/api-client';
import { useAuthStore } from '../../../../../../stores/auth-store';
import { Card, Button } from '@zed-hosting/ui-kit';
import { Navigation } from '../../../../../../components/navigation';
import { ProtectedRoute } from '../../../../../../components/protected-route';
import { useSSE } from '../../../../../../hooks/use-sse';
import { useNotificationContext } from '../../../../../../context/notification-context';

export default function ServerConsolePage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations();
  const { accessToken } = useAuthStore();
  const notifications = useNotificationContext();
  const queryClient = useQueryClient();
  const serverUuid = params?.uuid as string;
  const locale = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] || 'hu' : 'hu';
  
  useEffect(() => {
    if (!serverUuid) {
      router.push(`/${locale}/dashboard`);
    }
  }, [serverUuid, router, locale]);
  const [command, setCommand] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (accessToken) {
      apiClient.setAccessToken(accessToken);
    }
  }, [accessToken]);

  // Use SSE for real-time console logs if enabled, otherwise fallback to polling
  const [useSSEStream, setUseSSEStream] = useState(true); // Enable SSE by default
  const apiBaseUrl = typeof window !== 'undefined' ? window.location.origin.replace(/:\d+$/, ':3000') : '';
  const sseUrl = useSSEStream && accessToken && serverUuid
    ? `${apiBaseUrl}/api/servers/${serverUuid}/console/stream?token=${accessToken}`
    : null;

  // SSE hook
  const { data: sseData, isConnected: sseConnected } = useSSE({
    url: sseUrl || '',
    enabled: !!sseUrl && useSSEStream,
    onMessage: (data) => {
      if (data?.logs) {
        setLogs(data.logs);
        // Auto-scroll to bottom
        setTimeout(() => {
          if (consoleRef.current) {
            consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
          }
        }, 0);
      }
    },
    onError: () => {
      // Fallback to polling if SSE fails
      console.warn('SSE connection failed, falling back to polling');
      setUseSSEStream(false);
      notifications.addNotification({
        type: 'warning',
        title: 'Real-time kapcsolat sikertelen',
        message: 'Polling módra váltás...',
      });
    },
  });

  // Fallback to polling if SSE is disabled
  const { data: consoleData, isLoading } = useQuery<{ logs: string[] }>({
    queryKey: ['server-console', serverUuid],
    queryFn: async () => {
      return await apiClient.get<{ logs: string[] }>(`/servers/${serverUuid}/console?limit=100`);
    },
    enabled: !!accessToken && !!serverUuid && !useSSEStream,
    refetchInterval: 2000, // Refetch every 2 seconds
  });

  useEffect(() => {
    if (!useSSEStream && consoleData?.logs) {
      setLogs(consoleData.logs);
      // Auto-scroll to bottom
      if (consoleRef.current) {
        consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
      }
    }
  }, [consoleData, useSSEStream]);

  // Send command mutation
  const sendCommandMutation = useMutation({
    mutationFn: async (cmd: string) => {
      return await apiClient.post(`/servers/${serverUuid}/console/command`, { command: cmd });
    },
    onSuccess: () => {
      setCommand('');
      queryClient.invalidateQueries({ queryKey: ['server-console', serverUuid] });
    },
    onError: (err: any) => {
      notifications.addNotification({
        type: 'error',
        title: 'Hiba',
        message: err.message || 'Parancs küldése sikertelen',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim()) {
      sendCommandMutation.mutate(command);
    }
  };

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
                  {t('dashboard.server.console.title', { defaultValue: 'Szerver Konzol' })}
                </h1>
                <p style={{ color: '#cbd5e1' }}>
                  {t('dashboard.server.console.description', { defaultValue: 'Szerver konzol kimenet és parancsok küldése' })}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLogs([])}
                  title="Konzol törlése"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Törlés
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ['server-console', serverUuid] });
                  }}
                  title="Frissítés"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Frissítés
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/${locale}/dashboard/server/${serverUuid}`)}
                >
                  Vissza
                </Button>
              </div>
            </div>
          </header>

          <Card className="glass elevation-2 p-6">
            {/* Connection Status */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-2">
                {useSSEStream ? (
                  <>
                    <Wifi className="h-4 w-4" style={{ color: '#10b981' }} />
                    <span className="text-sm" style={{ color: '#10b981' }}>Real-time kapcsolat (SSE)</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4" style={{ color: '#f59e0b' }} />
                    <span className="text-sm" style={{ color: '#f59e0b' }}>Polling mód</span>
                  </>
                )}
              </div>
              <span className="text-xs" style={{ color: '#cbd5e1' }}>
                {logs.length} sor
              </span>
            </div>

            {/* Console Output */}
            <div
              ref={consoleRef}
              className="w-full h-96 p-4 rounded-lg font-mono text-sm overflow-y-auto mb-4"
              style={{
                backgroundColor: '#000',
                color: '#00ff00',
                border: '1px solid var(--color-border)',
              }}
            >
              {isLoading ? (
                <p style={{ color: '#cbd5e1' }}>Betöltés...</p>
              ) : logs.length === 0 ? (
                <p style={{ color: '#6b7280' }}>Nincs konzol kimenet</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} style={{ marginBottom: '2px' }}>
                    {log}
                  </div>
                ))
              )}
            </div>

            {/* Command Input */}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder={t('dashboard.server.console.commandPlaceholder', { defaultValue: 'Írj be egy parancsot...' })}
                className="flex-1 px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--color-bg-card)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-main)',
                }}
                disabled={sendCommandMutation.isPending}
              />
              <Button
                type="submit"
                variant="primary"
                disabled={sendCommandMutation.isPending || !command.trim()}
              >
                {sendCommandMutation.isPending ? 'Küldés...' : 'Küldés'}
              </Button>
            </form>
          </Card>
        </div>
      </main>
    </ProtectedRoute>
  );
}
