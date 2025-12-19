'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, Save, X } from 'lucide-react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  categoryId: string;
  tags: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function KnowledgeBaseEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = searchParams.get('locale') || 'hu';
  const articleId = searchParams.get('id') as string | null;

  const [article, setArticle] = useState<Partial<Article>>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    categoryId: '',
    tags: [],
    published: false,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(!!articleId);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/knowledge-base/categories');
        if (response.ok) {
          setCategories(await response.json());
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };

    fetchCategories();
  }, []);

  // Fetch article if editing
  useEffect(() => {
    if (articleId) {
      const fetchArticle = async () => {
        try {
          const response = await fetch(`/api/knowledge-base/${articleId}`);
          if (response.ok) {
            const data = await response.json();
            setArticle(data);
          }
        } catch (err) {
          setError('Cikk betöltési hiba');
        } finally {
          setLoading(false);
        }
      };

      fetchArticle();
    }
  }, [articleId]);

  // Auto-generate slug
  useEffect(() => {
    if (article.title && !articleId) {
      const slug = article.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setArticle(prev => ({ ...prev, slug }));
    }
  }, [article.title, articleId]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!article.title?.trim()) {
        throw new Error('A cím megadása kötelező');
      }
      if (!article.slug?.trim()) {
        throw new Error('A slug megadása kötelező');
      }
      if (!article.categoryId) {
        throw new Error('A kategória kiválasztása kötelező');
      }

      const method = articleId ? 'PUT' : 'POST';
      const url = `/api/knowledge-base${articleId ? `/${articleId}` : ''}`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(article),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Mentési hiba');
      }

      const savedArticle = await response.json();
      setArticle(savedArticle);
      setSuccess(
        articleId
          ? 'A cikk sikeresen frissítve!'
          : 'A cikk sikeresen létrehozva!'
      );
      
      // Redirect after save
      if (!articleId) {
        setTimeout(() => {
          router.push(`/${locale}/admin/knowledge-base`);
        }, 1500);
      } else {
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba történt');
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim()) {
      const newTags = [...(article.tags || []), tagInput.trim()];
      setArticle(prev => ({ ...prev, tags: [...new Set(newTags)] }));
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    const newTags = (article.tags || []).filter((_, i) => i !== index);
    setArticle(prev => ({ ...prev, tags: newTags }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <div className="h-8 w-8 border-4 border-slate-200 border-t-blue-600 rounded-full"></div>
          </div>
          <p className="mt-4 text-slate-600">Betöltés...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 max-w-4xl py-4">
          <div className="flex items-center justify-between">
            <Link href={`/${locale}/admin/knowledge-base`} className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
              <ArrowLeft size={20} />
              Vissza
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={20} />
              {saving ? 'Mentés...' : 'Mentés'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 max-w-4xl py-8">
        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <span className="text-red-700">{error}</span>
            <button onClick={() => setError(null)} className="text-red-600">
              <X size={20} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
            <span className="text-green-700">✓ {success}</span>
            <button onClick={() => setSuccess(null)} className="text-green-600">
              <X size={20} />
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Title */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Cim
            </label>
            <input
              type="text"
              value={article.title || ''}
              onChange={(e) => setArticle(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Cikk címe..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Slug */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              URL Slug
            </label>
            <input
              type="text"
              value={article.slug || ''}
              onChange={(e) => setArticle(prev => ({ ...prev, slug: e.target.value }))}
              placeholder="cikk-url-ja"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Kategória
            </label>
            <select
              value={article.categoryId || ''}
              onChange={(e) => setArticle(prev => ({ ...prev, categoryId: e.target.value }))}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Válasszon kategóriát --</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Excerpt */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Kivonat
            </label>
            <textarea
              value={article.excerpt || ''}
              onChange={(e) => setArticle(prev => ({ ...prev, excerpt: e.target.value }))}
              placeholder="Rövid kivonat a cikkből (160 karakter)"
              rows={3}
              maxLength={160}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              {(article.excerpt || '').length}/160
            </p>
          </div>

          {/* Content */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Tartalom (HTML)
            </label>
            <textarea
              value={article.content || ''}
              onChange={(e) => setArticle(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Cikk tartalma HTML formátumban..."
              rows={12}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>

          {/* Tags */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Címkék
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                placeholder="Új címke..."
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addTag}
                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center gap-2"
              >
                <Plus size={20} />
                Hozzáadás
              </button>
            </div>
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(index)}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      <X size={16} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Published */}
          <div className="mb-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={article.published || false}
                onChange={(e) => setArticle(prev => ({ ...prev, published: e.target.checked }))}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-semibold text-slate-900">Közzétett</span>
            </label>
          </div>

          {/* Save Button */}
          <div className="flex gap-3 pt-6 border-t border-slate-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
            >
              <Save size={20} />
              {saving ? 'Mentés...' : 'Cikk mentése'}
            </button>
            <Link
              href={`/${locale}/admin/knowledge-base`}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium"
            >
              Mégse
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
