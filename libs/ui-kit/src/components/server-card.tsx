'use client';

import * as React from 'react';
import { Card } from './card';
import { Badge } from './badge';
import { cn } from '../utils/cn';
import { 
  Server, 
  Circle, 
  Play, 
  Square, 
  RotateCw, 
  Download,
  Settings,
  Terminal,
  HardDrive,
  Activity
} from 'lucide-react';

export type ServerStatus = 'running' | 'stopped' | 'starting' | 'stopping' | 'updating' | 'error';

export interface ServerCardProps {
  name: string;
  uuid: string;
  game: string;
  status: ServerStatus;
  ip?: string;
  port?: number;
  players?: {
    current: number;
    max: number;
  };
  cpu?: number;
  memory?: {
    used: number;
    total: number;
  };
  uptime?: string;
  onStart?: () => void;
  onStop?: () => void;
  onRestart?: () => void;
  onUpdate?: () => void;
  onSettings?: () => void;
  onConsole?: () => void;
  onFiles?: () => void;
  className?: string;
}

const statusConfig: Record<ServerStatus, { color: string; label: string; icon: typeof Circle }> = {
  running: { color: 'bg-success-500', label: 'Fut', icon: Circle },
  stopped: { color: 'bg-error-500', label: 'Leállítva', icon: Square },
  starting: { color: 'bg-warning-500', label: 'Indítás...', icon: Play },
  stopping: { color: 'bg-warning-500', label: 'Leállítás...', icon: Square },
  updating: { color: 'bg-primary-500', label: 'Frissítés...', icon: Download },
  error: { color: 'bg-error-600', label: 'Hiba', icon: Circle },
};

export function ServerStatusBadge({ status }: { status: ServerStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className="flex items-center gap-1.5">
      <span className={cn('h-2 w-2 rounded-full animate-pulse', config.color)} />
      {config.label}
    </Badge>
  );
}

export function ServerCard({
  name,
  uuid,
  game,
  status,
  ip,
  port,
  players,
  cpu,
  memory,
  uptime,
  onStart,
  onStop,
  onRestart,
  onUpdate,
  onSettings,
  onConsole,
  onFiles,
  className,
}: ServerCardProps) {
  const isRunning = status === 'running';
  const isTransitioning = ['starting', 'stopping', 'updating'].includes(status);
  const canControl = !isTransitioning;

  return (
    <Card className={cn('p-6 hover:shadow-lg transition-shadow', className)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-500/10 rounded-lg">
            <Server className="h-6 w-6 text-primary-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">{name}</h3>
            <p className="text-sm text-text-secondary">{game}</p>
          </div>
        </div>
        <ServerStatusBadge status={status} />
      </div>

      {/* Connection Info */}
      {ip && port && (
        <div className="mb-4 p-3 bg-background-surface rounded-lg">
          <p className="text-sm text-text-secondary mb-1">Kapcsolat</p>
          <code className="text-sm font-mono text-text-primary">
            {ip}:{port}
          </code>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {players && (
          <div className="p-3 bg-background-surface rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-text-secondary" />
              <p className="text-xs text-text-secondary">Játékosok</p>
            </div>
            <p className="text-lg font-semibold text-text-primary">
              {players.current}/{players.max}
            </p>
          </div>
        )}
        
        {cpu !== undefined && (
          <div className="p-3 bg-background-surface rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-text-secondary" />
              <p className="text-xs text-text-secondary">CPU</p>
            </div>
            <p className="text-lg font-semibold text-text-primary">{cpu}%</p>
          </div>
        )}
        
        {memory && (
          <div className="p-3 bg-background-surface rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <HardDrive className="h-4 w-4 text-text-secondary" />
              <p className="text-xs text-text-secondary">Memória</p>
            </div>
            <p className="text-lg font-semibold text-text-primary">
              {Math.round((memory.used / memory.total) * 100)}%
            </p>
          </div>
        )}
        
        {uptime && (
          <div className="p-3 bg-background-surface rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-text-secondary" />
              <p className="text-xs text-text-secondary">Uptime</p>
            </div>
            <p className="text-sm font-medium text-text-primary">{uptime}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {!isRunning && onStart && (
          <button
            onClick={onStart}
            disabled={!canControl}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              'bg-success-500 text-white hover:bg-success-600',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <Play className="h-4 w-4" />
            Indítás
          </button>
        )}
        
        {isRunning && onStop && (
          <button
            onClick={onStop}
            disabled={!canControl}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              'bg-error-500 text-white hover:bg-error-600',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <Square className="h-4 w-4" />
            Leállítás
          </button>
        )}
        
        {isRunning && onRestart && (
          <button
            onClick={onRestart}
            disabled={!canControl}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              'bg-warning-500 text-white hover:bg-warning-600',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <RotateCw className="h-4 w-4" />
            Újraindítás
          </button>
        )}
        
        {onUpdate && (
          <button
            onClick={onUpdate}
            disabled={!canControl}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              'bg-primary-500 text-white hover:bg-primary-600',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <Download className="h-4 w-4" />
            Frissítés
          </button>
        )}
        
        {onConsole && (
          <button
            onClick={onConsole}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              'bg-background-elevated border border-border text-text-primary hover:bg-background-hover'
            )}
          >
            <Terminal className="h-4 w-4" />
            Konzol
          </button>
        )}
        
        {onSettings && (
          <button
            onClick={onSettings}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              'bg-background-elevated border border-border text-text-primary hover:bg-background-hover'
            )}
          >
            <Settings className="h-4 w-4" />
            Beállítások
          </button>
        )}
      </div>
    </Card>
  );
}
