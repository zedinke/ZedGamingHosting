'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useAuthStore } from '../../../../stores/auth-store';
import { Card, Button, Input } from '@zed-hosting/ui-kit';
import { apiClient } from '../../../../lib/api-client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNotificationContext } from '../../../../context/notification-context';
import { Navigation } from '../../../../components/navigation';
import { Copy, Trash2, Plus, Key, Eye, EyeOff } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  lastUsed?: string;
  createdAt: string;
}

export default function ApiKeysPage() {
  const router = useRouter();
  const params = useParams();
  const { user: currentUser, isAuthenticated, accessToken } = useAuthStore();
  const notifications = useNotificationContext();
  const queryClient = useQueryClient();
  const locale = (params.locale as string) || 'hu';
  const [isHydrated, setIsHydrated] = useState(false);
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [deleteConfirming, setDeleteConfirming] = useState<string | null>(null);

  useEffect(() => {
    setIsHydrated(true);
    if (accessToken) {
      apiClient.setAccessToken(accessToken);
    }
  }, [accessToken]);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }
  }, [isAuthenticated, isHydrated, router, locale]);

  const { data: apiKeys = [], isLoading: isLoadingKeys, refetch } = useQuery<ApiKey[]>({
    queryKey: ['api-keys'],
    queryFn: async () => {
      return await apiClient.get<ApiKey[]>('/users/api-keys');
    },
    enabled: isHydrated && isAuthenticated && !!accessToken,
  });

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newKeyName.trim()) {
      notifications.addNotification?.({
        type: 'error',
        title: 'Hiba',
        message: 'A kulcs neve kötelező',
      });
      return;
    }

    setCreatingKey(true);
    try {
      const response = await apiClient.post<ApiKey>('/users/api-keys', {
        name: newKeyName,
      });

      setNewKeyName('');
      setShowNewKeyForm(false);
      await refetch();

      notifications.addNotification?.({
        type: 'success',
        title: 'API kulcs létrehozva',
        message: `Kulcs: ${response.key}. Mentsd el biztonságosan!`,
      });

      // Auto-copy to clipboard
      navigator.clipboard.writeText(response.key);
    } catch (error: any) {
      notifications.addNotification?.({
        type: 'error',
        title: 'Hiba',
        message: error.message || 'Hiba az API kulcs létrehozásakor',
      });
    } finally {
      setCreatingKey(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    try {
      await apiClient.delete(`/users/api-keys/${keyId}`);
      setDeleteConfirming(null);
      await refetch();

      notifications.addNotification?.({
        type: 'success',
        title: 'API kulcs törölve',
        message: 'A kulcs sikeresen törlésre került.',
      });
    } catch (error: any) {
      notifications.addNotification?.({
        type: 'error',
        title: 'Hiba',
        message: error.message || 'Hiba az API kulcs törlésekor',
      });
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    notifications.addNotification?.({
      type: 'success',
      title: 'Lemásolva',
      message: 'Az API kulcs a vágólapra másolódott.',
    });
  };

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-surface">
        <p className="text-text-muted">Betöltés...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-surface">
        <p className="text-text-muted">Átirányítás...</p>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      <div className="min-h-screen bg-background-surface pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <header>
              <h1 className="text-4xl font-bold mb-2 text-text-primary">
                API Kulcsok
              </h1>
              <p className="text-text-muted">
                Kezeld az API hozzáféréseid és a fejlesztői kulcsaidat
              </p>
            </header>
            <Button
              variant="primary"
              onClick={() => setShowNewKeyForm(!showNewKeyForm)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Új Kulcs
            </Button>
          </div>

          {/* New Key Form */}
          {showNewKeyForm && (
            <Card className="p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4 text-text-primary">
                Új API Kulcs Létrehozása
              </h2>
              <form onSubmit={handleCreateKey} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Kulcs Neve <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="pl. Development, Production API"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={creatingKey}
                  >
                    {creatingKey ? 'Létrehozás...' : 'Kulcs Létrehozása'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowNewKeyForm(false);
                      setNewKeyName('');
                    }}
                  >
                    Mégse
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* API Keys List */}
          {isLoadingKeys ? (
            <Card className="p-12 text-center">
              <p className="text-text-muted">Betöltés...</p>
            </Card>
          ) : apiKeys.length === 0 ? (
            <Card className="p-12 text-center">
              <Key className="h-12 w-12 text-text-muted mx-auto mb-4 opacity-50" />
              <p className="text-text-muted mb-4">Nincs API kulcsod</p>
              <Button
                variant="primary"
                onClick={() => setShowNewKeyForm(true)}
              >
                Első Kulcs Létrehozása
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <Card key={apiKey.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary">
                        {apiKey.name}
                      </h3>
                      <p className="text-sm text-text-muted">
                        Létrehozva: {new Date(apiKey.createdAt).toLocaleDateString('hu-HU')}
                      </p>
                      {apiKey.lastUsed && (
                        <p className="text-sm text-text-muted">
                          Utolsó használat: {new Date(apiKey.lastUsed).toLocaleDateString('hu-HU')}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => setDeleteConfirming(apiKey.id)}
                      disabled={deleteConfirming !== null}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Delete Confirmation */}
                  {deleteConfirming === apiKey.id && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <p className="text-text-primary mb-3">
                        Biztos vagy benne? Ez nem vonható vissza!
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteKey(apiKey.id)}
                        >
                          Igen, Törlés
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setDeleteConfirming(null)}
                        >
                          Mégse
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Key Display */}
                  <div className="flex items-center gap-2 p-4 bg-background-surface rounded-lg border border-border">
                    <code className="flex-1 font-mono text-sm text-text-primary break-all">
                      {visibleKeys[apiKey.id] ? apiKey.key : '••••••••••••••••••••••••'}
                    </code>
                    <button
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                      className="p-2 hover:bg-background-overlay rounded"
                    >
                      {visibleKeys[apiKey.id] ? (
                        <EyeOff className="h-4 w-4 text-text-muted" />
                      ) : (
                        <Eye className="h-4 w-4 text-text-muted" />
                      )}
                    </button>
                    <button
                      onClick={() => handleCopyKey(apiKey.key)}
                      className="p-2 hover:bg-background-overlay rounded"
                    >
                      <Copy className="h-4 w-4 text-text-muted" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Usage Guide */}
          <Card className="p-6 mt-8 bg-gradient-to-br from-blue-50 to-blue-100">
            <h3 className="text-lg font-semibold mb-3 text-text-primary">
              API Kulcs Használata
            </h3>
            <div className="space-y-3 text-sm text-text-primary">
              <p>
                <strong>Authorization Header:</strong>
              </p>
              <code className="block p-3 bg-background-surface rounded font-mono text-xs overflow-x-auto">
                Authorization: Bearer YOUR_API_KEY
              </code>
              <p className="mt-3">
                <strong>Biztonsági Tippek:</strong>
              </p>
              <ul className="space-y-1 ml-4">
                <li>• Sosem oszd meg az API kulcsaidat</li>
                <li>• Tárold biztonságos helyen (env fájl, secrets manager)</li>
                <li>• Rendszeresen állítsd be az új kulcsokat, ha biztonsági gond van</li>
                <li>• Monitorozd az API kulcsok utolsó használatát</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
