'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { apiClient } from '../../../../lib/api-client';
import { useAuthStore } from '../../../../stores/auth-store';
import { Button } from '@zed-hosting/ui-kit';
import { ProtectedRoute } from '../../../../components/protected-route';
import { Navigation } from '../../../../components/navigation';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [gameType, setGameType] = useState<string>('MINECRAFT');
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

    try {
      const response = await apiClient.post<{ uuid: string }>('/servers', {
        gameType,
        nodeId: selectedNodeId,
        resources,
        startupPriority: 10,
      });

      const locale = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] || 'hu' : 'hu';
      router.push(`/${locale}/dashboard/server/${response.uuid}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create server');
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
                onChange={(e) => setSelectedNodeId(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--color-bg-card)',
                  borderColor: 'var(--color-border)',
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
                  min="1"
                  max="16"
                  value={resources.cpuLimit}
                  onChange={(e) =>
                    setResources({ ...resources, cpuLimit: parseInt(e.target.value) || 1 })
                  }
                  required
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-main)',
                  }}
                />
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
                  onChange={(e) =>
                    setResources({ ...resources, ramLimit: parseInt(e.target.value) || 512 })
                  }
                  required
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-main)',
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-main)' }}>
                  {t('dashboard.createServer.diskLimit') || 'Disk (GB)'}
                </label>
                <input
                  type="number"
                  min="10"
                  step="10"
                  value={resources.diskLimit}
                  onChange={(e) =>
                    setResources({ ...resources, diskLimit: parseInt(e.target.value) || 10 })
                  }
                  required
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-main)',
                  }}
                />
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

