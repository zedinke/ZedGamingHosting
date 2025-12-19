'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trash2, Edit2, Eye, Search } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: {
    id: string;
    name: string;
  };
  published: boolean;
  views: number;
  helpful: number;
  notHelpful: number;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
}

export default function KnowledgeBaseAdminPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchArticles();
    fetchCategories();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/knowledge-base/admin/articles');
      if (response.ok) {
        setArticles(await response.json());
      }
    } catch (err) {
      console.error('Failed to fetch articles:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/knowledge-base/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setArticles(articles.filter(a => a.id !== id));
        setDeleteConfirm(null);
      }
    } catch (err) {
      console.error('Failed to delete article:', err);
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || article.category.id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 max-w-6xl py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-slate-900">Tudásbázis kezelés</h1>
            <Link
              href={`/${locale}/admin/knowledge-base/editor`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              Új cikk
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <p className="text-sm text-blue-600">Összes cikk</p>
              <p className="text-2xl font-bold text-blue-900">{articles.length}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
              <p className="text-sm text-green-600">Közzétett</p>
              <p className="text-2xl font-bold text-green-900">
                {articles.filter(a => a.published).length}
              </p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4">
              <p className="text-sm text-yellow-600">Összes nézet</p>
              <p className="text-2xl font-bold text-yellow-900">
                {articles.reduce((sum, a) => sum + a.views, 0)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
              <p className="text-sm text-purple-600">Átlagos hasznosság</p>
              <p className="text-2xl font-bold text-purple-900">
                {articles.length > 0 && articles.filter(a => a.helpful + a.notHelpful > 0).length > 0
                  ? Math.round(
                      (articles.reduce((sum, a) => sum + a.helpful, 0) /
                        articles.reduce((sum, a) => sum + a.helpful + a.notHelpful, 0)) * 100
                    )
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="container mx-auto px-4 max-w-6xl py-6">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex gap-4 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Keresés..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Összes kategória</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Articles Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin">
              <div className="h-8 w-8 border-4 border-slate-200 border-t-blue-600 rounded-full"></div>
            </div>
            <p className="mt-4 text-slate-600">Betöltés...</p>
          </div>
        ) : filteredArticles.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold text-slate-900">Cím</th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-900">Kategória</th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-900">Státusz</th>
                  <th className="text-center px-6 py-3 font-semibold text-slate-900">Nézetek</th>
                  <th className="text-center px-6 py-3 font-semibold text-slate-900">Hasznos</th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-900">Frissítve</th>
                  <th className="text-center px-6 py-3 font-semibold text-slate-900">Műveletek</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredArticles.map((article) => (
                  <tr key={article.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900">{article.title}</p>
                        <p className="text-sm text-slate-500">{article.slug}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {article.category.name}
                    </td>
                    <td className="px-6 py-4">
                      {article.published ? (
                        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                          Közzétett
                        </span>
                      ) : (
                        <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-medium">
                          Vázlat
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600">
                      👁 {article.views}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600">
                      👍 {article.helpful}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(article.updatedAt).toLocaleDateString('hu-HU')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/${locale}/knowledge-base/${article.slug}`}
                          className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition"
                          title="Megtekintés"
                        >
                          <Eye size={18} />
                        </Link>
                        <Link
                          href={`/${locale}/admin/knowledge-base/editor?id=${article.id}`}
                          className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition"
                          title="Szerkesztés"
                        >
                          <Edit2 size={18} />
                        </Link>
                        <button
                          onClick={() => setDeleteConfirm(article.id)}
                          className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition"
                          title="Törlés"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-slate-600">Nincsenek cikkek</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Biztosan törli ezt a cikket?
            </h3>
            <p className="text-slate-600 mb-6">
              Ez az akció nem vonható vissza.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Mégse
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Törlés
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
