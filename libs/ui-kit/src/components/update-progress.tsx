'use client';

import * as React from 'react';
import { Progress } from './progress';
import { cn } from '../utils/cn';
import { Download, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';

export type UpdateStatus = 'idle' | 'pending' | 'downloading' | 'completed' | 'failed';

export interface UpdateProgress {
  status: UpdateStatus;
  progress?: number;
  message?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface UpdateProgressIndicatorProps {
  progress: UpdateProgress;
  serverName?: string;
  className?: string;
}

const statusConfig: Record<UpdateStatus, { color: string; icon: typeof Download; label: string }> = {
  idle: { color: 'text-text-secondary', icon: Download, label: 'Nincs frissítés' },
  pending: { color: 'text-warning-500', icon: Clock, label: 'Várakozás...' },
  downloading: { color: 'text-primary-500', icon: Loader2, label: 'Letöltés...' },
  completed: { color: 'text-success-500', icon: CheckCircle2, label: 'Sikeres' },
  failed: { color: 'text-error-500', icon: XCircle, label: 'Sikertelen' },
};

export function UpdateProgressIndicator({
  progress,
  serverName,
  className,
}: UpdateProgressIndicatorProps) {
  const config = statusConfig[progress.status];
  const Icon = config.icon;
  const isActive = ['pending', 'downloading'].includes(progress.status);

  return (
    <div className={cn('p-4 rounded-lg border border-border bg-background-surface', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon
            className={cn('h-5 w-5', config.color, isActive && 'animate-spin')}
          />
          <div>
            <p className="text-sm font-medium text-text-primary">{config.label}</p>
            {serverName && (
              <p className="text-xs text-text-secondary">{serverName}</p>
            )}
          </div>
        </div>
        
        {progress.progress !== undefined && (
          <span className="text-sm font-semibold text-text-primary">
            {Math.round(progress.progress)}%
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {progress.progress !== undefined && isActive && (
        <Progress value={progress.progress} className="mb-3" />
      )}

      {/* Message */}
      {progress.message && (
        <p className="text-sm text-text-secondary mb-2">{progress.message}</p>
      )}

      {/* Error */}
      {progress.error && (
        <div className="mt-2 p-3 bg-error-500/10 border border-error-500/20 rounded-md">
          <p className="text-sm text-error-500">{progress.error}</p>
        </div>
      )}

      {/* Timestamps */}
      {(progress.startedAt || progress.completedAt) && (
        <div className="mt-3 pt-3 border-t border-border text-xs text-text-muted">
          {progress.startedAt && (
            <p>Indítva: {new Date(progress.startedAt).toLocaleString('hu-HU')}</p>
          )}
          {progress.completedAt && (
            <p>Befejezve: {new Date(progress.completedAt).toLocaleString('hu-HU')}</p>
          )}
        </div>
      )}
    </div>
  );
}

export interface UpdateProgressListProps {
  updates: Array<{
    serverUuid: string;
    serverName: string;
    progress: UpdateProgress;
  }>;
  className?: string;
}

export function UpdateProgressList({ updates, className }: UpdateProgressListProps) {
  if (updates.length === 0) {
    return (
      <div className={cn('p-8 text-center', className)}>
        <Download className="h-12 w-12 text-text-muted mx-auto mb-3" />
        <p className="text-sm text-text-secondary">Nincs aktív frissítés</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {updates.map((update) => (
        <UpdateProgressIndicator
          key={update.serverUuid}
          progress={update.progress}
          serverName={update.serverName}
        />
      ))}
    </div>
  );
}
