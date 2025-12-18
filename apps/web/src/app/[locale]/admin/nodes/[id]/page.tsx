'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '../../../../../i18n/routing';
import { useParams } from 'next/navigation';
import { useAuthStore } from '../../../../../stores/auth-store';
import { Navigation } from '../../../../../components/navigation';
import { BackButton } from '../../../../../components/back-button';
import { Card, Button } from '@zed-hosting/ui-kit';
import { apiClient } from '../../../../../lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { useNotificationContext } from '../../../../../context/notification-context';

interface Node {
  id: string;
  name: string;
  ipAddress: string;
  publicFqdn?: string;
  totalRam: number;
  totalCpu: number;
  diskType: string;
  status: string;
  isClusterStorage?: boolean;
  maxConcurrentUpdates?: number;
}

export default function EditNodePage() {
  const router = useRouter();
  const params = useParams();
  // const locale = (params?.locale as string) || 'hu';
  const nodeId = params?.id as string;
  const { user: currentUser, isAuthenticated, accessToken } = useAuthStore();
  const notifications = useNotificationContext();
  const [isHydrated, setIsHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [managerUrl, setManagerUrl] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    ipAddress: '',
    publicFqdn: '',
    totalRam: 8192,
    totalCpu: 4,
    diskType: 'NVME',
    isClusterStorage: false,
    maxConcurrentUpdates: 2,
  });

  useEffect(() => {
    setIsHydrated(true);
    if (accessToken) {
      apiClient.setAccessToken(accessToken);
    }
    if (typeof window !== 'undefined') {
      try {
        setManagerUrl(window.location.origin);
      } catch {}
    }
  }, [accessToken]);

  useEffect(() => {
    if (isHydrated && !nodeId) {
      router.push('/admin/nodes');
    }
  }, [isHydrated, nodeId, router]);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push('/login');
      return;
    }

    const userRole = currentUser?.role?.toUpperCase();
    if (isHydrated && isAuthenticated && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'SUPERADMIN' && userRole !== 'RESELLER_ADMIN') {
      router.push('/dashboard');
      return;
    }
  }, [isAuthenticated, isHydrated, currentUser, router]);

  // Fetch node data
  const { data: nodeData, isLoading } = useQuery<Node>({
    queryKey: ['admin-node', nodeId],
    queryFn: async () => {
      if (!nodeId) return null as any;
      return await apiClient.get<Node>(`/nodes/${nodeId}`);
    },
    enabled: isHydrated && isAuthenticated && !!accessToken && !!nodeId,
  });

  useEffect(() => {
    if (nodeData) {
      setFormData({
        name: nodeData.name,
        ipAddress: nodeData.ipAddress,
        publicFqdn: nodeData.publicFqdn || '',
        totalRam: nodeData.totalRam,
        totalCpu: nodeData.totalCpu,
        diskType: nodeData.diskType,
        isClusterStorage: nodeData.isClusterStorage || false,
        maxConcurrentUpdates: nodeData.maxConcurrentUpdates || 2,
      });
    }
  }, [nodeData]);

  const installCommand = nodeData && managerUrl
    ? `curl -fsSL https://raw.githubusercontent.com/zedinke/ZedGamingHosting/main/scripts/install_node.sh | bash -s -- \\\n+  --manager-url ${managerUrl} \\\n+  --node-id ${nodeData.id} \\\n+  --api-key ${nodeData as any}.apiKey \\\n+  --daemon-port 3001`
    : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiClient.put(`/nodes/${nodeId}`, formData);
      router.push(`/${locale}/admin/nodes`);
    } catch (err: any) {
      setError(err.message || 'Node frissítése sikertelen');
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiClient.delete(`/nodes/${nodeId}`);
      
      notifications.addNotification({
        type: 'success',
        title: 'Node törölve',
        message: 'A node sikeresen törölve.',
      });
      
      router.push(`/${locale}/admin/nodes`);
    } catch (err: any) {
      const errorMessage = err.message || 'Node törlése sikertelen';
      setError(errorMessage);
      notifications.addNotification({
        type: 'error',
        title: 'Hiba',
        message: errorMessage,
      });
      setLoading(false);
      setDeleteConfirm(false);
    }
  };

  if (!isHydrated) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  const userRole = currentUser?.role?.toUpperCase();
  if (!isAuthenticated || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'SUPERADMIN' && userRole !== 'RESELLER_ADMIN')) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Redirecting...</p>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen" style={{ 
        backgroundColor: '#0a0a0a', 
        background: 'radial-gradient(at 0% 0%, rgba(14, 165, 233, 0.1) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(59, 130, 246, 0.1) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(14, 165, 233, 0.05) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(59, 130, 246, 0.05) 0px, transparent 50%), #0a0a0a',
        color: '#f8fafc',
        minHeight: '100vh'
      }}>
        <div className="container mx-auto px-4 py-8">
          <header className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: '#f8fafc' }}>Node Szerkesztése</h1>
              <p style={{ color: '#cbd5e1' }}>
                Node adatok módosítása
              </p>
            </div>
            <BackButton fallbackHref={'/admin/nodes'} />
          </header>

          {isLoading ? (
            <div className="text-center py-12">
              <p style={{ color: '#cbd5e1' }}>Betöltés...</p>
            </div>
          ) : (
            <>
            {nodeData && (
              <Card className="glass elevation-2 p-6 max-w-3xl mx-auto mb-8">
                <h2 className="text-xl font-semibold mb-2" style={{ color: '#f8fafc' }}>Telepítő parancs (Debian 12)</h2>
                <p className="text-sm mb-3" style={{ color: '#cbd5e1' }}>
                  Friss szerverre root-ként belépve futtasd az alábbit a daemon telepítéséhez és regisztrációhoz.
                </p>
                <div className="mb-3 flex gap-2 items-center">
                  <input
                    readOnly
                    value={installCommand}
                    className="w-full px-3 py-2 rounded border text-xs"
                    style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)', color: 'var(--color-text-main)' }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => { if (installCommand) await navigator.clipboard.writeText(installCommand); }}
                  >
                    Másolás
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mb-2">
                  <div><span className="text-text-muted">Node ID:</span> <span className="text-text-main">{nodeData.id}</span></div>
                  <div className="truncate"><span className="text-text-muted">API Key:</span> <span className="text-text-main">{(nodeData as any).apiKey || '***'}</span></div>
                  <div><span className="text-text-muted">Manager URL:</span> <span className="text-text-main">{managerUrl}</span></div>
                </div>
              </Card>
            )}

            <Card className="glass elevation-2 p-6 max-w-2xl mx-auto">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8fafc' }}>
                    Név *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8fafc' }}>
                    IP Cím *
                  </label>
                  <input
                    type="text"
                    value={formData.ipAddress}
                    onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
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
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8fafc' }}>
                    Publikus FQDN
                  </label>
                  <input
                    type="text"
                    value={formData.publicFqdn}
                    onChange={(e) => setFormData({ ...formData, publicFqdn: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--color-bg-card)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-main)',
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#f8fafc' }}>
                      CPU (Magok) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="64"
                      value={formData.totalCpu}
                      onChange={(e) => setFormData({ ...formData, totalCpu: parseInt(e.target.value) || 1 })}
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
                    <label className="block text-sm font-medium mb-2" style={{ color: '#f8fafc' }}>
                      RAM (MB) *
                    </label>
                    <input
                      type="number"
                      min="1024"
                      step="1024"
                      value={formData.totalRam}
                      onChange={(e) => setFormData({ ...formData, totalRam: parseInt(e.target.value) || 1024 })}
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

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8fafc' }}>
                    Lemez Típus *
                  </label>
                  <select
                    value={formData.diskType}
                    onChange={(e) => setFormData({ ...formData, diskType: e.target.value })}
                    required
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--color-bg-card)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-main)',
                    }}
                  >
                    <option value="NVME">NVMe</option>
                    <option value="SSD">SSD</option>
                    <option value="HDD">HDD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8fafc' }}>
                    Max. Egyidejű Frissítések
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.maxConcurrentUpdates}
                    onChange={(e) => setFormData({ ...formData, maxConcurrentUpdates: parseInt(e.target.value) || 2 })}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--color-bg-card)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-main)',
                    }}
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="clusterStorage"
                    checked={formData.isClusterStorage}
                    onChange={(e) => setFormData({ ...formData, isClusterStorage: e.target.checked })}
                    className="w-5 h-5 rounded border-2"
                    style={{
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-bg-card)',
                    }}
                  />
                  <label htmlFor="clusterStorage" className="ml-3 text-sm" style={{ color: '#f8fafc' }}>
                    Cluster Storage Node
                  </label>
                </div>

                {error && (
                  <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400">
                    {error}
                  </div>
                )}

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? 'Mentés...' : 'Mentés'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/admin/nodes')}
                    disabled={loading}
                  >
                    Mégse
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDelete}
                    disabled={loading}
                    style={{ 
                      backgroundColor: deleteConfirm ? '#ef4444' : undefined,
                      color: deleteConfirm ? '#fff' : undefined
                    }}
                  >
                    {deleteConfirm ? 'Biztosan törlöd?' : 'Törlés'}
                  </Button>
                </div>
              </form>
            </Card>
            </>
          )}
        </div>
      </main>
    </>
  );
}

