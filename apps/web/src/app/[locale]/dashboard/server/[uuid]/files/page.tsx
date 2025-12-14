'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../../../../lib/api-client';
import { useAuthStore } from '../../../../../../stores/auth-store';
import { Button } from '@zed-hosting/ui-kit';
import { Navigation } from '../../../../../../components/navigation';
import { ProtectedRoute } from '../../../../../../components/protected-route';
import { Folder, File, Upload, Download, Trash2 } from 'lucide-react';
import { useNotifications } from '../../../../../../hooks/use-notifications';

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
  const notifications = useNotifications();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const serverUuid = params?.uuid as string;
  const locale = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] || 'hu' : 'hu';
  
  useEffect(() => {
    if (!serverUuid) {
      router.push(`/${locale}/dashboard`);
    }
  }, [serverUuid, router, locale]);
  const [currentPath, setCurrentPath] = useState('/');
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (accessToken) {
      apiClient.setAccessToken(accessToken);
    }
  }, [accessToken]);

  // Fetch files
  const { data: files, isLoading } = useQuery<FileItem[]>({
    queryKey: ['server-files', serverUuid, currentPath],
    queryFn: async () => {
      const response = await apiClient.get<any[]>(`/servers/${serverUuid}/files?path=${encodeURIComponent(currentPath)}`);
      return response.map((item: any) => ({
        name: item.name,
        type: item.type,
        size: item.size,
        modified: item.modified,
      }));
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

  // File upload handler
  const handleFileUpload = async (file: File) => {
    if (!file || !serverUuid) return;

    setUploading(true);
    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Content = (e.target?.result as string).split(',')[1] || (e.target?.result as string);
          
          await apiClient.post(`/servers/${serverUuid}/files/upload`, {
            path: currentPath,
            filename: file.name,
            content: base64Content,
          });

          notifications.addNotification({
            type: 'success',
            title: 'Fájl feltöltve',
            message: `A ${file.name} fájl sikeresen feltöltve`,
          });

          queryClient.invalidateQueries({ queryKey: ['server-files', serverUuid, currentPath] });
        } catch (err: any) {
          notifications.addNotification({
            type: 'error',
            title: 'Hiba',
            message: err.message || 'Fájl feltöltés sikertelen',
          });
        } finally {
          setUploading(false);
        }
      };
      reader.onerror = () => {
        notifications.addNotification({
          type: 'error',
          title: 'Hiba',
          message: 'Fájl olvasás sikertelen',
        });
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      notifications.addNotification({
        type: 'error',
        title: 'Hiba',
        message: err.message || 'Fájl feltöltés sikertelen',
      });
      setUploading(false);
    }
  };

  // Download file
  const downloadMutation = useMutation({
    mutationFn: async (file: FileItem) => {
      if (!file || file.type !== 'file' || !serverUuid) return;
      
      const filePath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
      const response = await apiClient.get<{ content: string | ArrayBuffer }>(`/servers/${serverUuid}/files/content?path=${encodeURIComponent(filePath)}`);
      
      // If response is base64, decode it
      let blob: Blob;
      if (typeof response.content === 'string') {
        const binaryString = atob(response.content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        blob = new Blob([bytes]);
      } else {
        blob = new Blob([response.content]);
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      notifications.addNotification({
        type: 'success',
        title: 'Fájl letöltve',
        message: 'A fájl sikeresen letöltve',
      });
    },
    onError: (err: any) => {
      notifications.addNotification({
        type: 'error',
        title: 'Hiba',
        message: err.message || 'Fájl letöltés sikertelen',
      });
    },
  });

  // Delete file
  const deleteMutation = useMutation({
    mutationFn: async (file: FileItem) => {
      if (!file || !serverUuid) return;
      
      const filePath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
      await apiClient.delete(`/servers/${serverUuid}/files?path=${encodeURIComponent(filePath)}`);
    },
    onSuccess: () => {
      notifications.addNotification({
        type: 'success',
        title: 'Fájl törölve',
        message: 'A fájl sikeresen törölve',
      });
      queryClient.invalidateQueries({ queryKey: ['server-files', serverUuid, currentPath] });
    },
    onError: (err: any) => {
      notifications.addNotification({
        type: 'error',
        title: 'Hiba',
        message: err.message || 'Fájl törlés sikertelen',
      });
    },
  });

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      // Upload all dropped files
      droppedFiles.forEach((file) => {
        handleFileUpload(file);
      });
    }
  };

  const handleDownload = (file: FileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    downloadMutation.mutate(file);
  };

  const handleDelete = (file: FileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Biztosan törölni szeretnéd a(z) ${file.name} ${file.type === 'file' ? 'fájlt' : 'könyvtárat'}?`)) {
      deleteMutation.mutate(file);
    }
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
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  multiple
                  style={{ display: 'none' }}
                />
                <Button 
                  variant="outline" 
                  onClick={handleUploadClick}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Feltöltés...' : 'Feltöltés'}
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

          <div
            className="glass elevation-2 p-6 relative rounded-lg"
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              border: isDragging ? '2px dashed #3b82f6' : '1px solid var(--color-border)',
              backgroundColor: isDragging ? 'rgba(59, 130, 246, 0.1)' : 'var(--color-bg-card)',
            }}
          >
            {isDragging && (
              <div className="absolute inset-0 flex items-center justify-center bg-opacity-50 rounded-lg pointer-events-none z-10" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}>
                <div className="text-center">
                  <Upload className="h-12 w-12 mx-auto mb-2" style={{ color: '#3b82f6' }} />
                  <p className="text-lg font-semibold" style={{ color: '#3b82f6' }}>
                    Engedje el a fájlokat a feltöltéshez
                  </p>
                </div>
              </div>
            )}
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
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => handleDownload(file, e)}
                          disabled={downloadMutation.isPending}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => handleDelete(file, e)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
