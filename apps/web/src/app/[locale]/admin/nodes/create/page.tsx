'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '../../../../../i18n/routing';
import { useAuthStore } from '../../../../../stores/auth-store';
import { Navigation } from '../../../../../components/navigation';
import { BackButton } from '../../../../../components/back-button';
import { Card, Button } from '@zed-hosting/ui-kit';
import { apiClient } from '../../../../../lib/api-client';
import { useNotificationContext } from '../../../../../context/notification-context';

export default function CreateNodePage() {
  const router = useRouter();
  // const t = useTranslations();
  const { user: currentUser, isAuthenticated, accessToken } = useAuthStore();
  const notifications = useNotificationContext();
  const [isHydrated, setIsHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdNode, setCreatedNode] = useState<{ id: string; apiKey: string } | null>(null);
  const [managerUrl, setManagerUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  
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
        const origin = window.location.origin;
        setManagerUrl(origin);
      } catch (e) {
        // Silent error for manager URL
      }
    }
  }, [accessToken]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const node = await apiClient.post<{ id: string; apiKey: string }>('/nodes', formData);
      
      notifications.addNotification({
        type: 'success',
        title: 'Node létrehozva',
        message: `A node sikeresen létrehozva: ${formData.name}`,
      });
      // Show installer command instead of immediate redirect
      setCreatedNode({ id: node.id, apiKey: node.apiKey });
      setLoading(false);
    } catch (err: any) {
      const errorMessage = err.message || 'Node létrehozása sikertelen';
      setError(errorMessage);
      notifications.addNotification({
        type: 'error',
        title: 'Hiba',
        message: errorMessage,
      });
      setLoading(false);
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

  const installCommand = createdNode && managerUrl
    ? `curl -fsSL https://raw.githubusercontent.com/zedinke/ZedGamingHosting/main/scripts/install_node.sh | bash -s -- \\\n+  --manager-url ${managerUrl} \\\n+  --node-id ${createdNode.id} \\\n+  --api-key ${createdNode.apiKey} \\\n+  --daemon-port 3001`
    : '';

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
              <h1 className="text-3xl font-bold mb-2" style={{ color: '#f8fafc' }}>Új Node Létrehozása</h1>
              <p style={{ color: '#cbd5e1' }}>
                Új szerver node hozzáadása a rendszerhez
              </p>
            </div>
            <BackButton fallbackHref={`/admin/nodes`} />
          </header>

          {createdNode && (
            <Card className="glass elevation-2 p-6 max-w-3xl mx-auto mb-8">
              <h2 className="text-xl font-semibold mb-2" style={{ color: '#f8fafc' }}>Telepítő parancs (Debian 12)</h2>
              <p className="text-sm mb-3" style={{ color: '#cbd5e1' }}>
                SSH-zz be a friss szerverre root-ként, majd futtasd az alábbit. A parancs non-interactive módon telepíti a daemont és regisztrálja a Node-ot.
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
                  onClick={async () => { await navigator.clipboard.writeText(installCommand); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                >
                  {copied ? 'Másolva' : 'Másolás'}
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mb-2">
                <div><span className="text-text-muted">Node ID:</span> <span className="text-text-main">{createdNode.id}</span></div>
                <div className="truncate"><span className="text-text-muted">API Key:</span> <span className="text-text-main">{createdNode.apiKey}</span></div>
                <div><span className="text-text-muted">Manager URL:</span> <span className="text-text-main">{managerUrl}</span></div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button variant="primary" onClick={() => router.push('/admin/nodes')}>Kész, tovább a listához</Button>
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
                  placeholder="192.168.1.100"
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
                  placeholder="node1.example.com"
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
                  {loading ? 'Létrehozás...' : 'Node Létrehozása'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/nodes')}
                  disabled={loading}
                >
                  Mégse
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </main>
    </>
  );
}

