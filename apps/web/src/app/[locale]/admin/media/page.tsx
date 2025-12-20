'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { Upload, Trash2, Edit, Eye, EyeOff, Youtube, Image as ImageIcon, Video, Plus, Save, X } from 'lucide-react';
import { Button } from '@zed-hosting/ui-kit';
import { useNotificationContext } from '@/context/notification-context';
import { apiClient } from '@/lib/api-client';

interface HomepageSlide {
  id: string;
  title: string;
  description?: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'YOUTUBE';
  mediaUrl: string;
  linkUrl?: string;
  linkText?: string;
  sortOrder: number;
  isActive: boolean;
  publishedFrom?: string;
  publishedUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminMediaPage() {
  const queryClient = useQueryClient();
  const notifications = useNotificationContext();
  const [isCreating, setIsCreating] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HomepageSlide | null>(null);
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO' | 'YOUTUBE'>('IMAGE');
  const [uploading, setUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    mediaUrl: '',
    linkUrl: '',
    linkText: '',
    sortOrder: 0,
    isActive: true,
    publishedFrom: '',
    publishedUntil: '',
  });

  // Fetch all slides
  const { data: slides = [], isLoading } = useQuery<HomepageSlide[]>({
    queryKey: ['admin-slides'],
    queryFn: async () => {
      const res = await apiClient.get('/media/slides/all');
      return res.data;
    },
  });

  // Create slide mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/media/slides', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-slides'] });
      notifications.addNotification({
        type: 'success',
        title: 'Siker',
        message: 'Slide sikeresen létrehozva',
      });
      resetForm();
    },
    onError: (error: any) => {
      notifications.addNotification({
        type: 'error',
        title: 'Hiba',
        message: error.response?.data?.message || 'Slide létrehozása sikertelen',
      });
    },
  });

  // Update slide mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiClient.patch(`/media/slides/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-slides'] });
      notifications.addNotification({
        type: 'success',
        title: 'Siker',
        message: 'Slide sikeresen frissítve',
      });
      setEditingSlide(null);
      resetForm();
    },
    onError: (error: any) => {
      notifications.addNotification({
        type: 'error',
        title: 'Hiba',
        message: error.response?.data?.message || 'Slide frissítése sikertelen',
      });
    },
  });

  // Delete slide mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/media/slides/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-slides'] });
      notifications.addNotification({
        type: 'success',
        title: 'Siker',
        message: 'Slide sikeresen törölve',
      });
    },
    onError: (error: any) => {
      notifications.addNotification({
        type: 'error',
        title: 'Hiba',
        message: error.response?.data?.message || 'Slide törlése sikertelen',
      });
    },
  });

  // File upload dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: mediaType === 'IMAGE' 
      ? { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'] }
      : { 'video/*': ['.mp4', '.webm', '.mov'] },
    maxSize: mediaType === 'IMAGE' ? 10 * 1024 * 1024 : 50 * 1024 * 1024,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setUploading(true);

      try {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);

        const res = await apiClient.post(`/media/upload?type=${mediaType}`, formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        setFormData(prev => ({ ...prev, mediaUrl: res.data.path }));
        
        notifications.addNotification({
          type: 'success',
          title: 'Feltöltve',
          message: 'Média fájl sikeresen feltöltve',
        });
      } catch (error: any) {
        notifications.addNotification({
          type: 'error',
          title: 'Hiba',
          message: error.response?.data?.message || 'Feltöltés sikertelen',
        });
      } finally {
        setUploading(false);
      }
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      mediaUrl: '',
      linkUrl: '',
      linkText: '',
      sortOrder: 0,
      isActive: true,
      publishedFrom: '',
      publishedUntil: '',
    });
    setMediaType('IMAGE');
    setIsCreating(false);
    setEditingSlide(null);
  };

  const handleEdit = (slide: HomepageSlide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title,
      description: slide.description || '',
      mediaUrl: slide.mediaUrl,
      linkUrl: slide.linkUrl || '',
      linkText: slide.linkText || '',
      sortOrder: slide.sortOrder,
      isActive: slide.isActive,
      publishedFrom: slide.publishedFrom ? slide.publishedFrom.split('T')[0] : '',
      publishedUntil: slide.publishedUntil ? slide.publishedUntil.split('T')[0] : '',
    });
    setMediaType(slide.mediaType);
    setIsCreating(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      ...formData,
      mediaType,
      publishedFrom: formData.publishedFrom || undefined,
      publishedUntil: formData.publishedUntil || undefined,
    };

    if (editingSlide) {
      updateMutation.mutate({ id: editingSlide.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'IMAGE': return <ImageIcon className="w-5 h-5" />;
      case 'VIDEO': return <Video className="w-5 h-5" />;
      case 'YOUTUBE': return <Youtube className="w-5 h-5" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Média Kezelés
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Slideshow kezelése a főoldalon
          </p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)}>
          {isCreating ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {isCreating ? 'Mégse' : 'Új Slide'}
        </Button>
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {editingSlide ? 'Slide Szerkesztése' : 'Új Slide Létrehozása'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Media Type Tabs */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Média Típus
              </label>
              <div className="flex gap-2">
                {(['IMAGE', 'VIDEO', 'YOUTUBE'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setMediaType(type)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                      mediaType === type
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {getMediaIcon(type)}
                    {type === 'IMAGE' ? 'Kép' : type === 'VIDEO' ? 'Videó' : 'YouTube'}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload or YouTube URL */}
            {mediaType === 'YOUTUBE' ? (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  YouTube URL
                </label>
                <input
                  type="url"
                  value={formData.mediaUrl}
                  onChange={e => setFormData(prev => ({ ...prev, mediaUrl: e.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  {mediaType === 'IMAGE' ? 'Kép' : 'Videó'} Feltöltés
                </label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
                    isDragActive
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {uploading ? 'Feltöltés...' : isDragActive
                      ? 'Húzd ide a fájlt...'
                      : `Kattints vagy húzd ide a ${mediaType === 'IMAGE' ? 'képet' : 'videót'}`}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Max: {mediaType === 'IMAGE' ? '10MB' : '50MB'}
                  </p>
                </div>
                {formData.mediaUrl && (
                  <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                    ✓ Fájl feltöltve: {formData.mediaUrl}
                  </p>
                )}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Cím *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Leírás
              </label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Link URL & Text */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Link URL (CTA)
                </label>
                <input
                  type="url"
                  value={formData.linkUrl}
                  onChange={e => setFormData(prev => ({ ...prev, linkUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Gomb Szöveg
                </label>
                <input
                  type="text"
                  value={formData.linkText}
                  onChange={e => setFormData(prev => ({ ...prev, linkText: e.target.value }))}
                  placeholder="Tudj meg többet"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Sort Order & Active */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Sorrend
                </label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={e => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Aktív
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Slide megjelenítése
                  </span>
                </label>
              </div>
            </div>

            {/* Publish Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Publikálás Kezdete
                </label>
                <input
                  type="date"
                  value={formData.publishedFrom}
                  onChange={e => setFormData(prev => ({ ...prev, publishedFrom: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Publikálás Vége
                </label>
                <input
                  type="date"
                  value={formData.publishedUntil}
                  onChange={e => setFormData(prev => ({ ...prev, publishedUntil: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-2">
              <Button type="submit" disabled={!formData.mediaUrl || !formData.title}>
                <Save className="w-4 h-4 mr-2" />
                {editingSlide ? 'Frissítés' : 'Létrehozás'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Mégse
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Slides List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Típus
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Cím
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Sorrend
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Aktív
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Műveletek
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  Betöltés...
                </td>
              </tr>
            ) : slides.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  Nincs slide. Hozz létre egyet!
                </td>
              </tr>
            ) : (
              slides.map(slide => (
                <tr key={slide.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      {getMediaIcon(slide.mediaType)}
                      {slide.mediaType}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {slide.title}
                    </div>
                    {slide.description && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {slide.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {slide.sortOrder}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {slide.isActive ? (
                      <Eye className="w-5 h-5 text-green-500" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-gray-400" />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleEdit(slide)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Biztosan törlöd ezt a slide-ot?')) {
                            deleteMutation.mutate(slide.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
