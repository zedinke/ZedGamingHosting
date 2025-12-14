'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../../../../lib/api-client';
import { useAuthStore } from '../../../../../../stores/auth-store';
import { Card, Button } from '@zed-hosting/ui-kit';
import { Navigation } from '../../../../../../components/navigation';
import { ProtectedRoute } from '../../../../../../components/protected-route';
import { Plus, Trash2 } from 'lucide-react';

interface EnvVar {
  key: string;
  value: string;
}

export default function ServerEnvironmentPage() {
  const router = useRouter();
  const params = useParams();
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const serverUuid = params?.uuid as string;
  const locale = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] || 'hu' : 'hu';
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (accessToken) {
      apiClient.setAccessToken(accessToken);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!serverUuid) {
      router.push(`/${locale}/dashboard`);
    }
  }, [serverUuid, router, locale]);

  // Fetch server data
  const { data: server, isLoading } = useQuery({
    queryKey: ['server', serverUuid],
    queryFn: async () => {
      const response = await apiClient.get<any>(`/servers/${serverUuid}`);
      return response;
    },
    enabled: !!accessToken && !!serverUuid,
  });

  useEffect(() => {
    if (server?.envVars) {
      const vars = Object.entries(server.envVars).map(([key, value]) => ({
        key,
        value: value as string,
      }));
      setEnvVars(vars);
    }
  }, [server]);

  const handleAdd = () => {
    setEnvVars([...envVars, { key: '', value: '' }]);
  };

  const handleRemove = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: 'key' | 'value', value: string) => {
    const newVars = [...envVars];
    newVars[index][field] = value;
    setEnvVars(newVars);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Validate
    const emptyKeys = envVars.filter(v => !v.key.trim());
    if (emptyKeys.length > 0) {
      setError('Minden változónak kell lennie egy kulcsnak');
      setLoading(false);
      return;
    }

    const duplicateKeys = envVars.filter((v, i) => 
      envVars.findIndex(v2 => v2.key === v.key) !== i
    );
    if (duplicateKeys.length > 0) {
      setError('Nem lehetnek duplikált kulcsok');
      setLoading(false);
      return;
    }

    try {
      const envVarsObj = envVars.reduce((acc, v) => {
        if (v.key.trim()) {
          acc[v.key.trim()] = v.value;
        }
        return acc;
      }, {} as Record<string, string>);

      await apiClient.put(`/servers/${serverUuid}/environment`, { envVars: envVarsObj });
      
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['server', serverUuid] });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Environment változók mentése sikertelen');
    } finally {
      setLoading(false);
    }
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
                <h1 className="text-3xl font-bold mb-2" style={{ color: '#f8fafc' }}>
                  Environment Változók
                </h1>
                <p style={{ color: '#cbd5e1' }}>
                  Szerver környezeti változóinak kezelése
                </p>
              </div>
              <button
                onClick={() => router.push(`/${locale}/dashboard/server/${serverUuid}`)}
                className="px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--color-bg-card)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-main)',
                }}
              >
                Vissza
              </button>
            </div>
          </header>

          {isLoading ? (
            <div className="text-center py-12">
              <p style={{ color: '#cbd5e1' }}>Betöltés...</p>
            </div>
          ) : (
            <Card className="glass elevation-2 p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-3">
                  {envVars.map((envVar, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Kulcs"
                          value={envVar.key}
                          onChange={(e) => handleChange(index, 'key', e.target.value)}
                          className="px-4 py-2 rounded-lg border"
                          style={{
                            backgroundColor: 'var(--color-bg-card)',
                            borderColor: 'var(--color-border)',
                            color: 'var(--color-text-main)',
                          }}
                        />
                        <input
                          type="text"
                          placeholder="Érték"
                          value={envVar.value}
                          onChange={(e) => handleChange(index, 'value', e.target.value)}
                          className="px-4 py-2 rounded-lg border"
                          style={{
                            backgroundColor: 'var(--color-bg-card)',
                            borderColor: 'var(--color-border)',
                            color: 'var(--color-text-main)',
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemove(index)}
                        style={{ minWidth: 'auto', padding: '0.5rem' }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAdd}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Új változó hozzáadása
                </Button>

                {error && (
                  <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-4 rounded-lg bg-green-500/20 border border-green-500/50 text-green-400">
                    Environment változók sikeresen mentve!
                  </div>
                )}

                <div className="flex gap-4 pt-4">
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
                    onClick={() => router.push(`/${locale}/dashboard/server/${serverUuid}`)}
                    disabled={loading}
                  >
                    Mégse
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}

