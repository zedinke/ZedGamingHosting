'use client';

import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  File,
  Folder,
  FolderOpen,
  Download,
  Trash2,
  Upload,
  ChevronRight,
  Home,
  Eye,
  Copy,
  Clipboard,
} from 'lucide-react';

interface FileEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
}

interface FileManagerProps {
  serverId: string;
  initialPath?: string;
  readonly?: boolean;
}

export const FileManager: React.FC<FileManagerProps> = ({
  serverId,
  initialPath = '/',
  readonly = false,
}) => {
  const queryClient = useQueryClient();
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  // Fetch directory contents
  const { data: files = [], isLoading } = useQuery({
    queryKey: ['server-files', serverId, currentPath],
    queryFn: async () => {
      const params = new URLSearchParams({ path: currentPath });
      const res = await fetch(
        `/api/servers/${serverId}/files?${params.toString()}`
      );
      if (!res.ok) throw new Error('Failed to fetch files');
      return res.json() as Promise<FileEntry[]>;
    },
  });

  // Delete file mutation
  const deleteMutation = useMutation({
    mutationFn: async (filePath: string) => {
      const res = await fetch(`/api/servers/${serverId}/files`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath }),
      });
      if (!res.ok) throw new Error('Failed to delete file');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['server-files', serverId, currentPath],
      });
      setSelectedFiles([]);
    },
  });

  // Upload file mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', currentPath);

      const res = await fetch(`/api/servers/${serverId}/files/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to upload file');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['server-files', serverId, currentPath],
      });
    },
  });

  const handleNavigateToFolder = (folderPath: string) => {
    setCurrentPath(folderPath);
    setSelectedFiles([]);
  };

  const handleGoHome = () => {
    setCurrentPath('/');
    setSelectedFiles([]);
  };

  const handleBreadcrumb = (path: string) => {
    setCurrentPath(path);
    setSelectedFiles([]);
  };

  const handleToggleSelection = (filename: string) => {
    setSelectedFiles((prev) =>
      prev.includes(filename)
        ? prev.filter((f) => f !== filename)
        : [...prev, filename]
    );
  };

  const handleDownload = (file: FileEntry) => {
    const downloadLink = `/api/servers/${serverId}/files/download?path=${encodeURIComponent(file.path)}`;
    window.open(downloadLink, '_blank');
  };

  const handleDelete = (filePath: string) => {
    if (window.confirm(`Delete "${filePath}"?`)) {
      deleteMutation.mutate(filePath);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.currentTarget.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        uploadMutation.mutate(files[i]);
      }
    }
  };

  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  // Breadcrumb paths
  const pathParts = currentPath.split('/').filter(Boolean);
  const breadcrumbs = [
    { name: 'Home', path: '/' },
    ...pathParts.map((part, i) => ({
      name: part,
      path: '/' + pathParts.slice(0, i + 1).join('/'),
    })),
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">File Manager</h2>
        {!readonly && (
          <label className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition-colors">
            <Upload className="w-4 h-4 inline mr-2" />
            Upload
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploadMutation.isPending}
            />
          </label>
        )}
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg overflow-x-auto">
        {breadcrumbs.map((breadcrumb, index) => (
          <React.Fragment key={breadcrumb.path}>
            {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
            <button
              onClick={() => handleBreadcrumb(breadcrumb.path)}
              className="text-blue-600 hover:text-blue-700 whitespace-nowrap"
            >
              {breadcrumb.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* File List */}
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Loading files...</span>
        </div>
      ) : files.length > 0 ? (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-12 gap-4 p-4 font-semibold text-sm">
            <div className="col-span-6">Name</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Size</div>
            <div className="col-span-2">Actions</div>
          </div>

          <div className="divide-y">
            {files.map((file) => (
              <div
                key={file.path}
                className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 transition-colors items-center"
              >
                <div className="col-span-6 flex items-center gap-3 min-w-0">
                  {file.type === 'directory' ? (
                    <FolderOpen className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                  ) : (
                    <File className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    {file.type === 'directory' ? (
                      <button
                        onClick={() => handleNavigateToFolder(file.path)}
                        className="text-blue-600 hover:text-blue-700 font-medium truncate text-sm"
                      >
                        {file.name}
                      </button>
                    ) : (
                      <div className="text-gray-900 font-medium truncate text-sm">
                        {file.name}
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-span-2 text-sm text-gray-600">
                  {file.type === 'directory' ? 'Folder' : 'File'}
                </div>

                <div className="col-span-2 text-sm text-gray-600">
                  {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : '-'}
                </div>

                <div className="col-span-2 flex gap-2">
                  {file.type === 'file' && (
                    <>
                      <button
                        onClick={() => handleDownload(file)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCopyPath(file.path)}
                        className="p-2 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                        title="Copy path"
                      >
                        {copiedPath === file.path ? (
                          <Copy className="w-4 h-4 text-green-600" />
                        ) : (
                          <Clipboard className="w-4 h-4" />
                        )}
                      </button>
                    </>
                  )}
                  {!readonly && (
                    <button
                      onClick={() => handleDelete(file.path)}
                      disabled={deleteMutation.isPending}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:text-gray-400"
                      title="Delete"
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Folder className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
          <p className="text-gray-600">No files in this directory</p>
        </div>
      )}

      {/* Upload Status */}
      {uploadMutation.isPending && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-blue-700">Uploading files...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileManager;
