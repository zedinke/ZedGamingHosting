'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from '@i18n/translations';
import Editor from '@monaco-editor/react';
import { Button } from '@zed-hosting/ui-kit';
import { apiClient } from '../lib/api-client';
import { useAuthStore } from '../stores/auth-store';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
  children?: FileNode[];
}

interface FileManagerProps {
  serverUuid: string;
  initialPath?: string;
}

export function FileManager({ serverUuid, initialPath = '/' }: FileManagerProps) {
  const t = useTranslations();
  const { accessToken } = useAuthStore();
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.setAccessToken(accessToken);
    loadFiles();
  }, [currentPath, serverUuid, accessToken]);

  const loadFiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<{ files: FileNode[] }>(
        `/servers/${serverUuid}/files?path=${encodeURIComponent(currentPath)}`
      );
      setFiles(response.files || []);
    } catch (err: any) {
      setError(err.message || t('fileManager.error.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadFileContent = async (file: FileNode) => {
    if (file.type === 'directory') {
      setCurrentPath(file.path);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<{ content: string }>(
        `/servers/${serverUuid}/files/content?path=${encodeURIComponent(file.path)}`
      );
      setFileContent(response.content || '');
      setSelectedFile(file);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || t('fileManager.error.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const saveFile = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);
    try {
      await apiClient.put(`/servers/${serverUuid}/files/content`, {
        path: selectedFile.path,
        content: fileContent,
      });
      
      setIsEditing(false);
      // Show success message
    } catch (err: any) {
      setError(err.message || t('fileManager.error.saveFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFile = async (file: FileNode) => {
    if (!confirm(`Are you sure you want to delete ${file.name}?`)) return;

    setIsLoading(true);
    setError(null);
    try {
      await apiClient.delete(
        `/servers/${serverUuid}/files?path=${encodeURIComponent(file.path)}`
      );
      
      loadFiles();
      if (selectedFile?.path === file.path) {
        setSelectedFile(null);
        setFileContent('');
      }
    } catch (err: any) {
      setError(err.message || t('fileManager.error.deleteFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const getLanguageFromPath = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase() || '';
    const languageMap: Record<string, string> = {
      js: 'javascript',
      ts: 'typescript',
      json: 'json',
      yml: 'yaml',
      yaml: 'yaml',
      xml: 'xml',
      html: 'html',
      css: 'css',
      md: 'markdown',
      sh: 'shell',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      go: 'go',
      rs: 'rust',
      php: 'php',
      sql: 'sql',
      ini: 'ini',
      cfg: 'ini',
      txt: 'plaintext',
    };
    return languageMap[ext] || 'plaintext';
  };

  const navigateUp = () => {
    const parts = currentPath.split('/').filter(Boolean);
    if (parts.length > 0) {
      parts.pop();
      setCurrentPath('/' + parts.join('/'));
    }
  };

  return (
    <div className="flex h-full bg-gray-900 text-white">
      {/* File Browser Sidebar */}
      <div className="w-64 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold mb-2">{t('fileManager.title')}</h3>
          <div className="flex items-center gap-2 text-sm">
            <Button size="sm" variant="outline" onClick={navigateUp}>
              ↑
            </Button>
            <span className="flex-1 truncate text-gray-400">{currentPath}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isLoading && files.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              {t('fileManager.loading')}
            </div>
          ) : error ? (
            <div className="text-red-400 text-sm p-4">{error}</div>
          ) : files.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              {t('fileManager.empty') || 'No files'}
            </div>
          ) : (
            <div className="space-y-1">
              {files.map((file) => (
                <div
                  key={file.path}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-800 ${
                    selectedFile?.path === file.path ? 'bg-gray-800' : ''
                  }`}
                  onClick={() => loadFileContent(file)}
                  onDoubleClick={() => loadFileContent(file)}
                >
                  <span className="text-lg">
                    {file.type === 'directory' ? '📁' : '📄'}
                  </span>
                  <span className="flex-1 truncate text-sm">{file.name}</span>
                  {file.size && (
                    <span className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFile(file);
                    }}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-700">
          <Button size="sm" variant="outline" className="w-full mb-2">
            {t('fileManager.upload')}
          </Button>
          <Button size="sm" variant="outline" className="w-full">
            {t('fileManager.createFolder')}
          </Button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col">
        {selectedFile ? (
          <>
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <div>
                <h4 className="font-semibold">{selectedFile.name}</h4>
                <p className="text-sm text-gray-400">{selectedFile.path}</p>
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button size="sm" variant="primary" onClick={saveFile} disabled={isLoading}>
                      {t('fileManager.save')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        loadFileContent(selectedFile);
                      }}
                      disabled={isLoading}
                    >
                      {t('fileManager.cancel')}
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1">
              <Editor
                height="100%"
                language={getLanguageFromPath(selectedFile.path)}
                value={fileContent}
                onChange={(value) => setFileContent(value || '')}
                theme="vs-dark"
                options={{
                  readOnly: !isEditing,
                  minimap: { enabled: true },
                  fontSize: 14,
                  wordWrap: 'on',
                  automaticLayout: true,
                }}
              />
            </div>

            {error && (
              <div className="p-4 bg-red-900/20 border-t border-red-700 text-red-400">
                {error}
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="text-xl mb-2">📁</p>
              <p>{t('fileManager.selectFile') || 'Select a file to edit'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

