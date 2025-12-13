'use client';

import { useState } from 'react';
import { Card, Button } from '@zed-hosting/ui-kit';
import { Copy, X } from 'lucide-react';

interface ServerCloneDialogProps {
  server: {
    uuid: string;
    gameType: string;
    resources?: {
      cpuLimit?: number;
      ramLimit?: number;
      diskLimit?: number;
    };
    envVars?: Record<string, string>;
  };
  onClose: () => void;
  onClone: (data: {
    name?: string;
    nodeId?: string;
    resources?: {
      cpuLimit?: number;
      ramLimit?: number;
      diskLimit?: number;
    };
    envVars?: Record<string, string>;
  }) => Promise<void>;
  nodes?: Array<{ id: string; name: string }>;
}

export function ServerCloneDialog({ server, onClose, onClone, nodes }: ServerCloneDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: `${server.gameType} - Copy`,
    nodeId: '',
    cpuLimit: server.resources?.cpuLimit || 2,
    ramLimit: server.resources?.ramLimit ? (server.resources.ramLimit / 1024) : 2,
    diskLimit: server.resources?.diskLimit || 10,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onClone({
        name: formData.name,
        nodeId: formData.nodeId || undefined,
        resources: {
          cpuLimit: formData.cpuLimit,
          ramLimit: formData.ramLimit * 1024, // Convert GB to MB
          diskLimit: formData.diskLimit,
        },
        envVars: server.envVars,
      });
      onClose();
    } catch (error) {
      console.error('Clone error:', error);
      alert('Szerver klónozása sikertelen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
      <Card className="glass elevation-3 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Copy className="h-6 w-6" style={{ color: 'var(--color-primary)' }} />
            <h2 className="text-2xl font-bold" style={{ color: '#f8fafc' }}>
              Szerver klónozása
            </h2>
          </div>
          <button
            onClick={onClose}
            className="hover:opacity-70 transition-opacity"
            style={{ color: '#cbd5e1' }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#f8fafc' }}>
              Szerver neve *
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

          {nodes && nodes.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#f8fafc' }}>
                Node (opcionális)
              </label>
              <select
                value={formData.nodeId}
                onChange={(e) => setFormData({ ...formData, nodeId: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--color-bg-card)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-main)',
                }}
              >
                <option value="">Automatikus kiválasztás</option>
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#f8fafc' }}>
                CPU (mag) *
              </label>
              <input
                type="number"
                min="1"
                value={formData.cpuLimit}
                onChange={(e) => setFormData({ ...formData, cpuLimit: parseInt(e.target.value) || 1 })}
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
                RAM (GB) *
              </label>
              <input
                type="number"
                min="1"
                value={formData.ramLimit}
                onChange={(e) => setFormData({ ...formData, ramLimit: parseFloat(e.target.value) || 1 })}
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
                Disk (GB) *
              </label>
              <input
                type="number"
                min="1"
                value={formData.diskLimit}
                onChange={(e) => setFormData({ ...formData, diskLimit: parseInt(e.target.value) || 1 })}
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

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Klónozás...' : 'Klónozás'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Mégse
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

