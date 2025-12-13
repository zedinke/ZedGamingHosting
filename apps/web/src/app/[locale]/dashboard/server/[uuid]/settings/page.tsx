'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../../../../lib/api-client';
import { useAuthStore } from '../../../../../../stores/auth-store';
import { ProtectedRoute } from '../../../../../../components/protected-route';
import { Button } from '@zed-hosting/ui-kit';
import { GameServer } from '../../../../../../types/server';
import Link from 'next/link';

export default function ServerSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations();
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const serverUuid = params.uuid as string;

  const [resources, setResources] = useState({ cpuLimit: 0, ramLimit: 0, diskLimit: 0 });
  const [startupPriority, setStartupPriority] = useState(10);
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvValue, setNewEnvValue] = useState('');

  // Fetch server details
  const { data: server, isLoading } = useQuery<GameServer>({
    queryKey: ['server', serverUuid],
    queryFn: async () => {
      apiClient.setAccessToken(accessToken);
      const response = await apiClient.get<any>(`/servers/${serverUuid}`);
      return {
        uuid: response.uuid,
        id: response.id,
        gameType: response.gameType,
        status: response.status,
        nodeId: response.nodeId,
        ownerId: response.ownerId,
        startupPriority: response.startupPriority,
        resources: response.resources || { cpuLimit: 0, ramLimit: 0, diskLimit: 0 },
        envVars: response.envVars || {},
        clusterId: response.clusterId,
        createdAt: new Date(response.createdAt),
        updatedAt: new Date(response.updatedAt),
        name: response.name || response.gameType || 'Server',
        metrics: response.metrics?.[0] || { cpuUsage: 0, ramUsage: 0, diskUsage: 0 },
        node: response.node,
        ports: response.networkAllocations || [],
      };
    },
    enabled: !!accessToken && !!serverUuid,
  });

  // Update form when server data loads
  useEffect(() => {
    if (server) {
      setResources(server.resources || { cpuLimit: 0, ramLimit: 0, diskLimit: 0 });
      setStartupPriority(server.startupPriority || 10);
      setEnvVars(server.envVars || {});
    }
  }, [server]);

  // Update server mutation
  const updateMutation = useMutation({
    mutationFn: async (data: {
      resources?: { cpuLimit: number; ramLimit: number; diskLimit: number };
      startupPriority?: number;
      envVars?: Record<string, string>;
    }) => {
      return apiClient.patch(`/servers/${serverUuid}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server', serverUuid] });
      alert(t('dashboard.server.settings.updateSuccess') || 'Server updated successfully');
    },
    onError: (error: any) => {
      alert(error.message || t('dashboard.server.settings.updateError') || 'Failed to update server');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      resources,
      startupPriority,
      envVars,
    });
  };

  const handleAddEnvVar = () => {
    if (newEnvKey && newEnvValue) {
      setEnvVars({ ...envVars, [newEnvKey]: newEnvValue });
      setNewEnvKey('');
      setNewEnvValue('');
    }
  };

  const handleRemoveEnvVar = (key: string) => {
    const newEnvVars = { ...envVars };
    delete newEnvVars[key];
    setEnvVars(newEnvVars);
  };

  if (isLoading || !server) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-app)' }}>
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <p className="text-gray-400">{t('loading') || 'Loading...'}</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-app)' }}>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <Button variant="outline" onClick={() => router.back()} className="mb-4">
              ← {t('back') || 'Back'}
            </Button>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-main)' }}>
              {t('dashboard.server.settings.title') || 'Server Settings'}
            </h1>
            <p className="text-gray-400">
              {(server as any).name || server.gameType}
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-700 mb-6">
            <nav className="flex gap-4">
              <Link
                href={`/dashboard/server/${serverUuid}`}
                className="pb-4 px-2 text-gray-400 hover:text-gray-300 transition-colors"
              >
                {t('dashboard.server.tabs.overview') || 'Overview'}
              </Link>
              <Link
                href={`/dashboard/server/${serverUuid}/console`}
                className="pb-4 px-2 text-gray-400 hover:text-gray-300 transition-colors"
              >
                {t('dashboard.server.tabs.console') || 'Console'}
              </Link>
              <Link
                href={`/dashboard/server/${serverUuid}/files`}
                className="pb-4 px-2 text-gray-400 hover:text-gray-300 transition-colors"
              >
                {t('dashboard.server.tabs.files') || 'Files'}
              </Link>
              <Link
                href={`/dashboard/server/${serverUuid}/settings`}
                className="pb-4 px-2 border-b-2 border-blue-500 text-blue-400 font-medium"
              >
                {t('dashboard.server.tabs.settings') || 'Settings'}
              </Link>
            </nav>
          </div>

          {/* Settings Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Resources Section */}
            <div
              className="rounded-lg p-6 border"
              style={{
                backgroundColor: 'var(--color-bg-card)',
                borderColor: 'var(--color-border)',
              }}
            >
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-main)' }}>
                {t('dashboard.server.settings.resources.title') || 'Resources'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-main)' }}>
                    {t('dashboard.server.settings.resources.cpu') || 'CPU (Cores)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    value={resources.cpuLimit}
                    onChange={(e) => setResources({ ...resources, cpuLimit: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--color-bg-app)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-main)',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-main)' }}>
                    {t('dashboard.server.settings.resources.ram') || 'RAM (MB)'}
                  </label>
                  <input
                    type="number"
                    min="512"
                    step="512"
                    value={resources.ramLimit}
                    onChange={(e) => setResources({ ...resources, ramLimit: parseInt(e.target.value) || 512 })}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--color-bg-app)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-main)',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-main)' }}>
                    {t('dashboard.server.settings.resources.disk') || 'Disk (GB)'}
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={resources.diskLimit}
                    onChange={(e) => setResources({ ...resources, diskLimit: parseInt(e.target.value) || 10 })}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--color-bg-app)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-main)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Startup Priority */}
            <div
              className="rounded-lg p-6 border"
              style={{
                backgroundColor: 'var(--color-bg-card)',
                borderColor: 'var(--color-border)',
              }}
            >
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-main)' }}>
                {t('dashboard.server.settings.startupPriority.title') || 'Startup Priority'}
              </h2>
              <p className="text-sm text-gray-400 mb-4">
                {t('dashboard.server.settings.startupPriority.description') || 'Lower numbers start first (1 = highest priority)'}
              </p>
              <input
                type="number"
                min="1"
                max="100"
                value={startupPriority}
                onChange={(e) => setStartupPriority(parseInt(e.target.value) || 10)}
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--color-bg-app)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-main)',
                }}
              />
            </div>

            {/* Environment Variables */}
            <div
              className="rounded-lg p-6 border"
              style={{
                backgroundColor: 'var(--color-bg-card)',
                borderColor: 'var(--color-border)',
              }}
            >
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-main)' }}>
                {t('dashboard.server.settings.envVars.title') || 'Environment Variables'}
              </h2>
              
              {/* Existing Env Vars */}
              <div className="space-y-2 mb-4">
                {Object.entries(envVars).map(([key, value]) => (
                  <div key={key} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={key}
                      disabled
                      className="flex-1 px-4 py-2 rounded-lg border text-sm"
                      style={{
                        backgroundColor: 'var(--color-bg-app)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-muted)',
                      }}
                    />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => setEnvVars({ ...envVars, [key]: e.target.value })}
                      className="flex-1 px-4 py-2 rounded-lg border text-sm"
                      style={{
                        backgroundColor: 'var(--color-bg-app)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-main)',
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveEnvVar(key)}
                    >
                      {t('dashboard.server.settings.envVars.remove') || 'Remove'}
                    </Button>
                  </div>
                ))}
              </div>

              {/* Add New Env Var */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={t('dashboard.server.settings.envVars.keyPlaceholder') || 'Key'}
                  value={newEnvKey}
                  onChange={(e) => setNewEnvKey(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--color-bg-app)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-main)',
                  }}
                />
                <input
                  type="text"
                  placeholder={t('dashboard.server.settings.envVars.valuePlaceholder') || 'Value'}
                  value={newEnvValue}
                  onChange={(e) => setNewEnvValue(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--color-bg-app)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-main)',
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddEnvVar}
                >
                  {t('dashboard.server.settings.envVars.add') || 'Add'}
                </Button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="submit"
                variant="primary"
                disabled={updateMutation.isPending}
                className="flex-1"
              >
                {updateMutation.isPending
                  ? t('dashboard.server.settings.saving') || 'Saving...'
                  : t('dashboard.server.settings.save') || 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={updateMutation.isPending}
              >
                {t('dashboard.server.settings.cancel') || 'Cancel'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}

