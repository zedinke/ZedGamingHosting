'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { apiClient } from '../../../../lib/api-client';
import { useAuthStore } from '../../../../stores/auth-store';
import { Button } from '@zed-hosting/ui-kit';
import { ProtectedRoute } from '../../../../components/protected-route';
import { Navigation } from '../../../../components/navigation';
import { useNotificationContext } from '../../../../context/notification-context';
import { serverCreateSchema } from '../../../../lib/validation';
import { z } from 'zod';

interface Node {
  id: string;
  name: string;
  ipAddress: string;
  publicFqdn?: string;
  totalRam: number;
  totalCpu: number;
  status: string;
}

export default function CreateServerPage() {
  const t = useTranslations();
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const notifications = useNotificationContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [gameType, setGameType] = useState<string>('MINECRAFT');
  const [serverName, setServerName] = useState<string>('');
  const [resources, setResources] = useState({
    cpuLimit: 2,
    ramLimit: 2048,
    diskLimit: 50,
  });

  useEffect(() => {
    apiClient.setAccessToken(accessToken);
    if (accessToken) {
      loadNodes();
    }
  }, [accessToken]);

  const loadNodes = async () => {
    try {
      const response = await apiClient.get<Node[]>('/nodes');
      const onlineNodes = response.filter((node) => node.status === 'ONLINE');
      setNodes(onlineNodes);
      if (onlineNodes.length > 0) {
        setSelectedNodeId(onlineNodes[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load nodes:', err);
      setError('Failed to load available nodes');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const formData = {
        nodeId: selectedNodeId,
        gameType,
        cpuLimit: resources.cpuLimit,
        ramLimit: resources.ramLimit,
        diskLimit: resources.diskLimit,
        name: serverName || undefined,
      };

      // Validate with Zod
      serverCreateSchema.parse(formData);

      const response = await apiClient.post<{ uuid: string }>('/servers', {
        name: serverName || undefined,
        gameType,
        nodeId: selectedNodeId,
        resources,
        startupPriority: 10,
      });

      notifications.addNotification({
        type: 'success',
        title: 'Szerver létrehozva',
        message: 'A szerver sikeresen létrejött',
      });

      const locale = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] || 'hu' : 'hu';
      router.push(`/${locale}/dashboard/server/${response.uuid}`);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const errors: { [key: string]: string } = {};
        err.errors.forEach((e) => {
          if (e.path.length > 0) {
            errors[e.path[0]] = e.message;
          }
        });
        setFieldErrors(errors);
        setError('Kérjük, javítsa ki a hibákat az űrlapban');
      } else {
        setError(err.message || 'Szerver létrehozása sikertelen');
        notifications.addNotification({
          type: 'error',
          title: 'Hiba',
          message: err.message || 'Szerver létrehozása sikertelen',
        });
      }
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <Navigation />
      <div className="min-h-screen" style={{ 
        backgroundColor: '#0a0a0a', 
        background: 'radial-gradient(at 0% 0%, rgba(14, 165, 233, 0.1) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(59, 130, 246, 0.1) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(14, 165, 233, 0.05) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(59, 130, 246, 0.05) 0px, transparent 50%), #0a0a0a',
        color: '#f8fafc',
        minHeight: '100vh'
      }}>
        <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--color-text-main)' }}>
            {t('dashboard.createServer.title') || 'Create New Server'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Node Selection */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-main)' }}>
                {t('dashboard.createServer.selectNode') || 'Select Node'}
              </label>
              <select
                value={selectedNodeId}
                onChange={(e) => {
                  setSelectedNodeId(e.target.value);
                  if (fieldErrors.nodeId) {
                    setFieldErrors({ ...fieldErrors, nodeId: '' });
                  }
                }}
                required
                className={`w-full px-4 py-2 rounded-lg border ${
                  fieldErrors.nodeId ? 'border-red-500' : ''
                }`}
                style={{
                  backgroundColor: 'var(--color-bg-card)',
                  borderColor: fieldErrors.nodeId ? '#ef4444' : 'var(--color-border)',
                  color: 'var(--color-text-main)',
                }}
              >
                {nodes.length === 0 ? (
                  <option value="">{t('dashboard.createServer.noNodesAvailable') || 'No nodes available'}</option>
                ) : (
                  nodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.name} ({node.totalCpu} CPU, {node.totalRam}MB RAM)
                    </option>
                  ))
                )}
              </select>
              {fieldErrors.nodeId && (
                <p className="mt-1 text-sm text-red-400">{fieldErrors.nodeId}</p>
              )}
            </div>

            {/* Game Type */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-main)' }}>
                {t('dashboard.createServer.gameType') || 'Game Type'}
              </label>
              <select
                value={gameType}
                onChange={(e) => setGameType(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--color-bg-card)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-main)',
                }}
              >
                <option value="MINECRAFT">Minecraft</option>
                <option value="ARK">ARK: Survival Evolved</option>
                <option value="RUST">Rust</option>
                <option value="CS2">Counter-Strike 2</option>
                <option value="PALWORLD">Palworld</option>
              </select>
            </div>

            {/* Resources */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-main)' }}>
                  {t('dashboard.createServer.cpuLimit') || 'CPU (Cores)'}
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="128"
                  step="0.5"
                  value={resources.cpuLimit}
                  onChange={(e) => {
                    setResources({ ...resources, cpuLimit: parseFloat(e.target.value) || 0.5 });
                    if (fieldErrors.cpuLimit) {
                      setFieldErrors({ ...fieldErrors, cpuLimit: '' });
                    }
                  }}
                  required
                  className={`w-full px-4 py-2 rounded-lg border ${
                    fieldErrors.cpuLimit ? 'border-red-500' : ''
                  }`}
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    borderColor: fieldErrors.cpuLimit ? '#ef4444' : 'var(--color-border)',
                    color: 'var(--color-text-main)',
                  }}
                />
                {fieldErrors.cpuLimit && (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors.cpuLimit}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-main)' }}>
                  {t('dashboard.createServer.ramLimit') || 'RAM (MB)'}
                </label>
                <input
                  type="number"
                  min="512"
                  step="512"
                  value={resources.ramLimit}
                  onChange={(e) => {
                    setResources({ ...resources, ramLimit: parseInt(e.target.value) || 512 });
                    if (fieldErrors.ramLimit) {
                      setFieldErrors({ ...fieldErrors, ramLimit: '' });
                    }
                  }}
                  required
                  className={`w-full px-4 py-2 rounded-lg border ${
                    fieldErrors.ramLimit ? 'border-red-500' : ''
                  }`}
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    borderColor: fieldErrors.ramLimit ? '#ef4444' : 'var(--color-border)',
                    color: 'var(--color-text-main)',
                  }}
                />
                {fieldErrors.ramLimit && (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors.ramLimit}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-main)' }}>
                  {t('dashboard.createServer.diskLimit') || 'Disk (GB)'}
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={resources.diskLimit}
                  onChange={(e) => {
                    setResources({ ...resources, diskLimit: parseInt(e.target.value) || 1 });
                    if (fieldErrors.diskLimit) {
                      setFieldErrors({ ...fieldErrors, diskLimit: '' });
                    }
                  }}
                  required
                  className={`w-full px-4 py-2 rounded-lg border ${
                    fieldErrors.diskLimit ? 'border-red-500' : ''
                  }`}
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    borderColor: fieldErrors.diskLimit ? '#ef4444' : 'var(--color-border)',
                    color: 'var(--color-text-main)',
                  }}
                />
                {fieldErrors.diskLimit && (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors.diskLimit}</p>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="submit"
                variant="primary"
                disabled={loading || nodes.length === 0}
                className="flex-1"
              >
                {loading
                  ? t('dashboard.createServer.creating') || 'Creating...'
                  : t('dashboard.createServer.create') || 'Create Server'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                {t('dashboard.createServer.cancel') || 'Cancel'}
              </Button>
            </div>
          </form>
        </div>
      </div>
      </div>
    </ProtectedRoute>
  );
}

