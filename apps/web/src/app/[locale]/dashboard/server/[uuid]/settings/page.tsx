'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../../../../lib/api-client';
import { useAuthStore } from '../../../../../../stores/auth-store';
import { ProtectedRoute } from '../../../../../../components/protected-route';
import { Navigation } from '../../../../../../components/navigation';
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@zed-hosting/ui-kit';
import { GameServer } from '../../../../../../types/server';
import Link from 'next/link';

export default function ServerSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations();
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const serverUuid = params.uuid as string;
  const locale = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] || 'hu' : 'hu';

  const [resources, setResources] = useState({ cpuLimit: 0, ramLimit: 0, diskLimit: 0 });
  const [startupPriority, setStartupPriority] = useState(10);
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvValue, setNewEnvValue] = useState('');

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
        name: (response as any).name || response.gameType || 'Server',
        metrics: response.metrics?.[0] || { cpuUsage: 0, ramUsage: 0, diskUsage: 0 },
        node: response.node,
        ports: response.networkAllocations || [],
      };
    },
    enabled: !!accessToken && !!serverUuid,
  });

  useEffect(() => {
    if (server) {
      setResources({
        cpuLimit: server.resources?.cpuLimit || 0,
        ramLimit: server.resources?.ramLimit || 0,
        diskLimit: server.resources?.diskLimit || 0,
      });
      setStartupPriority(server.startupPriority || 10);
      setEnvVars(server.envVars || {});
    }
  }, [server]);

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
      alert(t('dashboard.server.settingsPage.updateSuccess') || 'Server settings updated successfully!');
    },
    onError: (error: any) => {
      alert(t('dashboard.server.settingsPage.updateError', { error: error.message }) || `Error updating server settings: ${error.message}`);
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
          <Navigation />
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
                <p className="mt-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {t('loading') || 'Loading...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-app)' }}>
        <Navigation />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4">
              ← {t('back') || 'Back'}
            </Button>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-main)' }}>
              {t('dashboard.server.settingsPage.title') || 'Server Settings'}
            </h1>
            <p style={{ color: 'var(--color-text-muted)' }}>
              {(server as any).name || server.gameType}
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <nav className="flex gap-1 -mb-px">
              <Link
                href={`/${locale}/dashboard/server/${serverUuid}`}
                className="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
                style={{
                  borderColor: 'transparent',
                  color: 'var(--color-text-muted)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-main)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-muted)';
                }}
              >
                {t('dashboard.server.tabs.overview') || 'Overview'}
              </Link>
              <Link
                href={`/${locale}/dashboard/server/${serverUuid}/console`}
                className="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
                style={{
                  borderColor: 'transparent',
                  color: 'var(--color-text-muted)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-main)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-muted)';
                }}
              >
                {t('dashboard.server.tabs.console') || 'Console'}
              </Link>
              <Link
                href={`/${locale}/dashboard/server/${serverUuid}/files`}
                className="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
                style={{
                  borderColor: 'transparent',
                  color: 'var(--color-text-muted)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-main)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-muted)';
                }}
              >
                {t('dashboard.server.tabs.files') || 'Files'}
              </Link>
              <Link
                href={`/${locale}/dashboard/server/${serverUuid}/settings`}
                className="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
                style={{
                  borderColor: 'var(--color-primary)',
                  color: 'var(--color-primary)',
                }}
              >
                {t('dashboard.server.tabs.settings') || 'Settings'}
              </Link>
              <Link
                href={`/${locale}/dashboard/server/${serverUuid}/metrics`}
                className="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
                style={{
                  borderColor: 'transparent',
                  color: 'var(--color-text-muted)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-main)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-muted)';
                }}
              >
                {t('dashboard.server.tabs.metrics') || 'Metrics'}
              </Link>
            </nav>
          </div>

          {/* Settings Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Resources Section */}
            <Card className="border-[var(--color-border)] bg-[var(--color-bg-card)]">
              <CardHeader>
                <CardTitle style={{ color: 'var(--color-text-main)' }}>
                  {t('dashboard.server.settingsPage.resources') || 'Resources'}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium" style={{ color: 'var(--color-text-main)' }}>
                    {t('dashboard.server.settingsPage.cpuLimit') || 'CPU (Cores)'}
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="16"
                    value={resources.cpuLimit}
                    onChange={(e) => setResources({ ...resources, cpuLimit: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium" style={{ color: 'var(--color-text-main)' }}>
                    {t('dashboard.server.settingsPage.ramLimit') || 'RAM (MB)'}
                  </label>
                  <Input
                    type="number"
                    min="512"
                    step="512"
                    value={resources.ramLimit}
                    onChange={(e) => setResources({ ...resources, ramLimit: parseInt(e.target.value) || 512 })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium" style={{ color: 'var(--color-text-main)' }}>
                    {t('dashboard.server.settingsPage.diskLimit') || 'Disk (GB)'}
                  </label>
                  <Input
                    type="number"
                    min="10"
                    step="10"
                    value={resources.diskLimit}
                    onChange={(e) => setResources({ ...resources, diskLimit: parseInt(e.target.value) || 10 })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Startup Priority */}
            <Card className="border-[var(--color-border)] bg-[var(--color-bg-card)]">
              <CardHeader>
                <CardTitle style={{ color: 'var(--color-text-main)' }}>
                  {t('dashboard.server.settingsPage.startupPriority') || 'Startup Priority'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  Lower numbers start first (1 = highest priority)
                </p>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={startupPriority}
                  onChange={(e) => setStartupPriority(parseInt(e.target.value) || 10)}
                />
              </CardContent>
            </Card>

            {/* Environment Variables */}
            <Card className="border-[var(--color-border)] bg-[var(--color-bg-card)]">
              <CardHeader>
                <CardTitle style={{ color: 'var(--color-text-main)' }}>
                  {t('dashboard.server.settingsPage.environmentVariables') || 'Environment Variables'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Existing Env Vars */}
                {Object.entries(envVars).length > 0 && (
                  <div className="space-y-2">
                    {Object.entries(envVars).map(([key, value]) => (
                      <div key={key} className="flex gap-2 items-center">
                        <Input
                          type="text"
                          value={key}
                          disabled
                          className="flex-1"
                          style={{ opacity: 0.6 }}
                        />
                        <Input
                          type="text"
                          value={value}
                          onChange={(e) => setEnvVars({ ...envVars, [key]: e.target.value })}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveEnvVar(key)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add New Env Var */}
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder={t('dashboard.server.settingsPage.envVarName') || 'Name'}
                    value={newEnvKey}
                    onChange={(e) => setNewEnvKey(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="text"
                    placeholder={t('dashboard.server.settingsPage.envVarValue') || 'Value'}
                    value={newEnvValue}
                    onChange={(e) => setNewEnvValue(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddEnvVar}
                    disabled={!newEnvKey || !newEnvValue}
                  >
                    {t('dashboard.server.settingsPage.addEnvVar') || 'Add'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <Button
                type="submit"
                variant="primary"
                disabled={updateMutation.isPending}
                className="flex-1"
              >
                {updateMutation.isPending
                  ? t('dashboard.server.settingsPage.saving') || 'Saving...'
                  : t('dashboard.server.settingsPage.saveChanges') || 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={updateMutation.isPending}
              >
                {t('dashboard.server.settingsPage.cancel') || 'Cancel'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
