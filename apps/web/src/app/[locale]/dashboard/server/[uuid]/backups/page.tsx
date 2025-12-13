'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../../../../stores/auth-store';
import { Navigation } from '../../../../../../components/navigation';
import { Card, Button } from '@zed-hosting/ui-kit';
import { useNotificationContext } from '../../../../../../context/notification-context';
import { apiClient } from '../../../../../../lib/api-client';
import { ProtectedRoute } from '../../../../../../components/protected-route';
import { ArrowLeft, Plus, Download, Trash2, RotateCcw, Calendar, HardDrive } from 'lucide-react';

interface Backup {
  id: string;
  name: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'RESTORING';
  size?: number;
  createdAt: string;
}

export default function ServerBackupsPage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations();
  const { accessToken } = useAuthStore();
  const notifications = useNotificationContext();
  const queryClient = useQueryClient();

  const serverUuid = params?.uuid as string;
  const locale = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] || 'hu' : 'hu';

  const [backupName, setBackupName] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    if (accessToken) {
      apiClient.setAccessToken(accessToken);
    }
  }, [accessToken]);

  const { data: backups = [], isLoading } = useQuery<Backup[]>({
    queryKey: ['server-backups', serverUuid],
    queryFn: async () => {
      const response = await apiClient.get<Backup[]>(`/servers/${serverUuid}/backups`);
      return response;
    },
    enabled: !!accessToken && !!serverUuid,
    refetchInterval: 30000,
  });

  const createBackupMutation = useMutation({
    mutationFn: async (name?: string) => {
      return await apiClient.post(`/servers/${serverUuid}/backups`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server-backups', serverUuid] });
      notifications.addNotification({
        type: 'success',
        title: 'Backup indítva',
        message: 'A backup létrehozása elindult.',
      });
      setShowCreateDialog(false);
      setBackupName('');
    },
    onError: (err: any) => {
      notifications.addNotification({
        type: 'error',
        title: 'Hiba',
        message: err.message || 'A backup létrehozása sikertelen volt.',
      });
    },
  });

  const restoreBackupMutation = useMutation({
    mutationFn: async (backupId: string) => {
      return await apiClient.post(`/servers/${serverUuid}/backups/${backupId}/restore`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server-backups', serverUuid] });
      notifications.addNotification({
        type: 'success',
        title: 'Visszaállítás indítva',
        message: 'A backup visszaállítása elindult.',
      });
    },
    onError: (err: any) => {
      notifications.addNotification({
        type: 'error',
        title: 'Hiba',
        message: err.message || 'A backup visszaállítása sikertelen volt.',
      });
    },
  });

  const deleteBackupMutation = useMutation({
    mutationFn: async (backupId: string) => {
      return await apiClient.delete(`/servers/${serverUuid}/backups/${backupId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server-backups', serverUuid] });
      notifications.addNotification({
        type: 'success',
        title: 'Backup törölve',
        message: 'A backup sikeresen törölve.',
      });
    },
    onError: (err: any) => {
      notifications.addNotification({
        type: 'error',
        title: 'Hiba',
        message: err.message || 'A backup törlése sikertelen volt.',
      });
    },
  });

  const handleCreateBackup = () => {
    if (!window.confirm('Biztosan létre szeretnéd hozni a backup-ot?')) {
      return;
    }
    createBackupMutation.mutate(backupName || undefined);
  };

  const handleRestoreBackup = (backupId: string, backupName: string) => {
    if (!window.confirm(`Biztosan vissza szeretnéd állítani ezt a backup-ot: ${backupName}? Ez felülírja a jelenlegi szerver állapotát.`)) {
      return;
    }
    restoreBackupMutation.mutate(backupId);
  };

  const handleDeleteBackup = (backupId: string, backupName: string) => {
    if (!window.confirm(`Biztosan törölni szeretnéd ezt a backup-ot: ${backupName}? Ez a művelet visszavonhatatlan.`)) {
      return;
    }
    deleteBackupMutation.mutate(backupId);
  };

  const getStatusColor = (status: Backup['status']) => {
    switch (status) {
      case 'COMPLETED':
        return '#22c55e';
      case 'PENDING':
        return '#f59e0b';
      case 'FAILED':
        return '#ef4444';
      case 'RESTORING':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
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
                <button
                  onClick={() => router.push(`/${locale}/dashboard/server/${serverUuid}`)}
                  className="flex items-center gap-2 mb-4 text-sm hover:opacity-70 transition-opacity"
                  style={{ color: '#cbd5e1' }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Vissza a szerverhez
                </button>
                <h1 className="text-3xl font-bold mb-2" style={{ color: '#f8fafc' }}>
                  Szerver Backups
                </h1>
                <p style={{ color: '#cbd5e1' }}>
                  Backup-ok kezelése és visszaállítása
                </p>
              </div>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Új Backup
              </Button>
            </div>
          </header>

          {/* Create Backup Dialog */}
          {showCreateDialog && (
            <Card className="glass elevation-2 p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#f8fafc' }}>
                Új Backup Létrehozása
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#cbd5e1' }}>
                    Backup neve (opcionális)
                  </label>
                  <input
                    type="text"
                    value={backupName}
                    onChange={(e) => setBackupName(e.target.value)}
                    placeholder="Backup neve..."
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--color-bg-card)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-main)',
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateBackup}
                    disabled={createBackupMutation.isPending}
                  >
                    {createBackupMutation.isPending ? 'Létrehozás...' : 'Backup Létrehozása'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateDialog(false);
                      setBackupName('');
                    }}
                  >
                    Mégse
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Backups List */}
          {isLoading ? (
            <div className="text-center py-12">
              <p style={{ color: '#cbd5e1' }}>Betöltés...</p>
            </div>
          ) : backups.length === 0 ? (
            <Card className="glass elevation-2 p-12 text-center">
              <HardDrive className="h-12 w-12 mx-auto mb-4 opacity-50" style={{ color: '#cbd5e1' }} />
              <p style={{ color: '#cbd5e1' }}>Nincs még backup</p>
              <p className="text-sm mt-2" style={{ color: '#9ca3af' }}>
                Hozz létre egy backup-ot a szerver állapotának mentéséhez
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {backups.map((backup) => (
                <Card key={backup.id} className="glass elevation-2 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <HardDrive className="h-5 w-5" style={{ color: '#cbd5e1' }} />
                        <h3 className="text-lg font-semibold" style={{ color: '#f8fafc' }}>
                          {backup.name}
                        </h3>
                        <span
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{
                            backgroundColor: `${getStatusColor(backup.status)}20`,
                            color: getStatusColor(backup.status),
                          }}
                        >
                          {backup.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm" style={{ color: '#cbd5e1' }}>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(backup.createdAt).toLocaleString('hu-HU')}
                        </div>
                        {backup.size && (
                          <div className="flex items-center gap-1">
                            <Download className="h-4 w-4" />
                            {formatSize(backup.size)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {backup.status === 'COMPLETED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreBackup(backup.id, backup.name)}
                          disabled={restoreBackupMutation.isPending}
                          className="flex items-center gap-2"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Visszaállítás
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteBackup(backup.id, backup.name)}
                        disabled={deleteBackupMutation.isPending}
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Törlés
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}

