'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Search, Tag } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  articleCount?: number;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: Category;
  tags: string[];
  views: number;
  helpful: number;
  notHelpful: number;
  published: boolean;
}

export default function KnowledgeBasePage() {
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [loading, setLoading] = useState(false);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/knowledge-base/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch articles
  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchTerm) params.append('q', searchTerm);
        if (selectedCategory) params.append('category', selectedCategory);

        const response = await fetch(`/api/knowledge-base/search?${params}`);
        if (response.ok) {
          const data = await response.json();
          setArticles(data.articles || []);
        }
      } catch (error) {
        console.error('Failed to fetch articles:', error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchArticles();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="text-4xl font-bold mb-4">Tudásbázis</h1>
          <p className="text-blue-100 mb-8">Keresse meg a válaszokat, amit keres</p>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-3 text-blue-200" size={20} />
            <input
              type="text"
              placeholder="Keresés cikkekben..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg text-slate-900 placeholder-slate-500"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Kategóriák</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition ${
                    selectedCategory === ''
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Összes cikk
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.slug)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition ${
                      selectedCategory === category.slug
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{category.name}</span>
                      {category.articleCount && (
                        <span className="text-xs bg-slate-200 px-2 py-1 rounded">
                          {category.articleCount}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Articles List */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin">
                  <div className="h-8 w-8 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
                </div>
                <p className="mt-4 text-slate-600">Betöltés...</p>
              </div>
            ) : articles.length > 0 ? (
              <div className="space-y-4">
                {articles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/knowledge-base/${article.slug}`}
                  >
                    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md hover:border-blue-200 border-2 border-transparent transition cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-900 hover:text-blue-600">
                            {article.title}
                          </h3>
                          <p className="text-slate-600 mt-2 line-clamp-2">
                            {article.excerpt}
                          </p>
                        </div>
                        <ChevronRight className="text-slate-400 flex-shrink-0" />
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-slate-500">
                            📚 {article.category.name}
                          </span>
                          <span className="text-sm text-slate-500">
                            👁 {article.views} nézet
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            👍 {article.helpful}
                          </span>
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                            👎 {article.notHelpful}
                          </span>
                        </div>
                      </div>

                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {article.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded flex items-center gap-1"
                            >
                              <Tag size={12} />
                              {tag}
                            </span>
                          ))}
                          {article.tags.length > 3 && (
                            <span className="text-xs text-slate-500 px-2 py-1">
                              +{article.tags.length - 3} további
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Search className="mx-auto text-slate-300 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Nincsenek találatok</h3>
                <p className="text-slate-600">
                  {searchTerm || selectedCategory
                    ? 'Próbáljon meg más keresési feltételeket használni'
                    : 'Nincs elérhető cikk'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
