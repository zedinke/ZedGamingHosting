'use client';

import Link from 'next/link';
import { Card } from '@zed-hosting/ui-kit';
import { Play, Square, RotateCcw, Trash2, Server } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ServerCardProps {
  server: {
    uuid: string;
    name?: string;
    gameType: string;
    status: 'RUNNING' | 'STOPPED' | 'STARTING' | 'STOPPING' | 'CRASHED' | 'INSTALLING' | 'UPDATING';
    resources?: {
      cpuLimit?: number;
      ramLimit?: number;
      diskLimit?: number;
    };
    node?: {
      name?: string;
    };
    metrics?: {
      cpuUsage?: number;
      ramUsage?: number;
      diskUsage?: number;
    };
  };
  locale: string;
  onStart?: (uuid: string) => void;
  onStop?: (uuid: string) => void;
  onRestart?: (uuid: string) => void;
  onDelete?: (uuid: string) => void;
}

export function ServerCard({ server, locale, onStart, onStop, onRestart, onDelete }: ServerCardProps) {
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return '#22c55e';
      case 'STOPPED':
        return '#6b7280';
      case 'STARTING':
      case 'STOPPING':
        return '#f59e0b';
      case 'CRASHED':
        return '#ef4444';
      case 'INSTALLING':
      case 'UPDATING':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return 'Futó';
      case 'STOPPED':
        return 'Leállított';
      case 'STARTING':
        return 'Indítás...';
      case 'STOPPING':
        return 'Leállítás...';
      case 'CRASHED':
        return 'Összeomlott';
      case 'INSTALLING':
        return 'Telepítés...';
      case 'UPDATING':
        return 'Frissítés...';
      default:
        return status;
    }
  };

  return (
    <Card className="glass elevation-2 hover:elevation-3 transition-all duration-200">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Server className="h-5 w-5" style={{ color: '#cbd5e1' }} />
              <Link
                href={`/${locale}/dashboard/server/${server.uuid}`}
                className="text-lg font-semibold hover:opacity-70 transition-opacity"
                style={{ color: '#f8fafc' }}
              >
                {server.name || `${server.gameType} Server`}
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getStatusColor(server.status) }}
              />
              <span className="text-sm" style={{ color: '#cbd5e1' }}>
                {getStatusText(server.status)}
              </span>
              <span className="text-sm mx-2" style={{ color: '#6b7280' }}>•</span>
              <span className="text-sm" style={{ color: '#cbd5e1' }}>
                {server.gameType}
              </span>
            </div>
          </div>
        </div>

        {/* Resource Usage */}
        {server.metrics && (
          <div className="mb-4 space-y-2">
            {server.metrics.cpuUsage !== undefined && (
              <div>
                <div className="flex justify-between text-xs mb-1" style={{ color: '#9ca3af' }}>
                  <span>CPU</span>
                  <span>{server.metrics.cpuUsage.toFixed(1)}%</span>
                </div>
                <div className="w-full rounded-full overflow-hidden" style={{ backgroundColor: '#1f2937', height: '6px' }}>
                  <div
                    className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-blue-500 to-blue-400"
                    style={{ width: `${Math.min(server.metrics.cpuUsage || 0, 100)}%` }}
                  />
                </div>
              </div>
            )}
            {server.metrics.ramUsage !== undefined && (
              <div>
                <div className="flex justify-between text-xs mb-1" style={{ color: '#9ca3af' }}>
                  <span>RAM</span>
                  <span>{server.metrics.ramUsage.toFixed(1)}%</span>
                </div>
                <div className="w-full rounded-full overflow-hidden" style={{ backgroundColor: '#1f2937', height: '6px' }}>
                  <div
                    className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-green-500 to-green-400"
                    style={{ width: `${Math.min(server.metrics.ramUsage || 0, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Resources */}
        {server.resources && (
          <div className="mb-4 text-xs space-y-1" style={{ color: '#9ca3af' }}>
            <div>
              CPU: {server.resources.cpuLimit} mag • RAM: {(server.resources.ramLimit / 1024).toFixed(1)} GB • Disk: {server.resources.diskLimit} GB
            </div>
            {server.node && (
              <div>Node: {server.node.name}</div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => router.push(`/${locale}/dashboard/server/${server.uuid}`)}
            className="flex-1 px-3 py-2 text-sm rounded-lg border transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-main)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-card)';
            }}
          >
            Részletek
          </button>
          {server.status === 'STOPPED' && onStart && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStart(server.uuid);
              }}
              className="px-3 py-2 text-sm rounded-lg border transition-colors"
              style={{
                backgroundColor: '#22c55e20',
                borderColor: '#22c55e50',
                color: '#22c55e',
              }}
              title="Indítás"
            >
              <Play className="h-4 w-4" />
            </button>
          )}
          {server.status === 'RUNNING' && (
            <>
              {onStop && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStop(server.uuid);
                  }}
                  className="px-3 py-2 text-sm rounded-lg border transition-colors"
                  style={{
                    backgroundColor: '#ef444420',
                    borderColor: '#ef444450',
                    color: '#ef4444',
                  }}
                  title="Leállítás"
                >
                  <Square className="h-4 w-4" />
                </button>
              )}
              {onRestart && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestart(server.uuid);
                  }}
                  className="px-3 py-2 text-sm rounded-lg border transition-colors"
                  style={{
                    backgroundColor: '#f59e0b20',
                    borderColor: '#f59e0b50',
                    color: '#f59e0b',
                  }}
                  title="Újraindítás"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
            </>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Biztosan törölni szeretnéd ezt a szervert?')) {
                  onDelete(server.uuid);
                }
              }}
              className="px-3 py-2 text-sm rounded-lg border transition-colors"
              style={{
                backgroundColor: '#ef444420',
                borderColor: '#ef444450',
                color: '#ef4444',
              }}
              title="Törlés"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
