'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../../../lib/api-client';
import { useAuthStore } from '../../../../../../stores/auth-store';
import { Card, Button } from '@zed-hosting/ui-kit';
import { Navigation } from '../../../../../../components/navigation';
import { ProtectedRoute } from '../../../../../../components/protected-route';
import { Folder, File, Upload, Download, Trash2 } from 'lucide-react';

interface FileItem {
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
}

export default function ServerFilesPage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations();
  const { accessToken } = useAuthStore();
  const serverUuid = params.uuid as string;
  const locale = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] || 'hu' : 'hu';
  const [currentPath, setCurrentPath] = useState('/');

  useEffect(() => {
    if (accessToken) {
      apiClient.setAccessToken(accessToken);
    }
  }, [accessToken]);

  // Fetch files
  const { data: files, isLoading } = useQuery<FileItem[]>({
    queryKey: ['server-files', serverUuid, currentPath],
    queryFn: async () => {
      // TODO: Implement GET /api/servers/:uuid/files endpoint
      // return await apiClient.get<FileItem[]>(`/servers/${serverUuid}/files?path=${encodeURIComponent(currentPath)}`);
      return [];
    },
    enabled: !!accessToken && !!serverUuid,
  });

  const handleFileClick = (file: FileItem) => {
    if (file.type === 'directory') {
      setCurrentPath(currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`);
    }
  };

  const handlePathClick = (index: number) => {
    const parts = currentPath.split('/').filter(Boolean);
    const newPath = '/' + parts.slice(0, index + 1).join('/');
    setCurrentPath(newPath);
  };

  const pathParts = currentPath.split('/').filter(Boolean);

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
                  {t('dashboard.server.files.title', { defaultValue: 'Fájlkezelő' })}
                </h1>
                <p style={{ color: '#cbd5e1' }}>
                  {t('dashboard.server.files.description', { defaultValue: 'Szerver fájlok kezelése' })}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Feltöltés
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/${locale}/dashboard/server/${serverUuid}`)}
                >
                  Vissza
                </Button>
              </div>
            </div>
          </header>

          <Card className="glass elevation-2 p-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-4 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <button
                onClick={() => setCurrentPath('/')}
                className="text-sm hover:underline"
                style={{ color: 'var(--color-text-muted)' }}
              >
                /
              </button>
              {pathParts.map((part, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span style={{ color: 'var(--color-text-muted)' }}>/</span>
                  <button
                    onClick={() => handlePathClick(index)}
                    className="text-sm hover:underline"
                    style={{ color: 'var(--color-text-main)' }}
                  >
                    {part}
                  </button>
                </div>
              ))}
            </div>

            {/* File List */}
            {isLoading ? (
              <div className="text-center py-12">
                <p style={{ color: '#cbd5e1' }}>Betöltés...</p>
              </div>
            ) : !files || files.length === 0 ? (
              <div className="text-center py-12">
                <p style={{ color: '#cbd5e1' }}>Nincs fájl ebben a könyvtárban</p>
              </div>
            ) : (
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-opacity-10 hover:bg-white transition-colors cursor-pointer"
                    onClick={() => handleFileClick(file)}
                    style={{ backgroundColor: file.type === 'directory' ? 'rgba(59, 130, 246, 0.1)' : 'transparent' }}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {file.type === 'directory' ? (
                        <Folder className="h-5 w-5" style={{ color: '#3b82f6' }} />
                      ) : (
                        <File className="h-5 w-5" style={{ color: '#cbd5e1' }} />
                      )}
                      <div className="flex-1">
                        <p className="font-medium" style={{ color: '#f8fafc' }}>
                          {file.name}
                        </p>
                        {file.size !== undefined && (
                          <p className="text-xs" style={{ color: '#cbd5e1' }}>
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {file.type === 'file' && (
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>
    </ProtectedRoute>
  );
}
