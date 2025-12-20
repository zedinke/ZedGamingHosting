import React, { useState, useEffect, useCallback } from 'react';
import debounce from 'lodash/debounce';
import { Loader2, Search, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface Article {
  id: string;
  title: string;
  category: string;
  tags: string[];
  excerpt?: string;
  linkedTicketsCount?: number;
}

interface KnowledgeBaseSearchProps {
  onSelectArticle?: (article: Article) => void;
  showPopular?: boolean;
  maxResults?: number;
}

export const KnowledgeBaseSearch: React.FC<KnowledgeBaseSearchProps> = ({
  onSelectArticle,
  showPopular = true,
  maxResults = 10,
}) => {
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['kb-categories'],
    queryFn: async () => {
      const res = await fetch('/api/knowledge-base/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
  });

  // Fetch search results (debounced)
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['kb-search', keyword],
    queryFn: async () => {
      if (!keyword.trim()) return [];
      const res = await fetch(
        `/api/knowledge-base/articles/search/${encodeURIComponent(keyword)}`
      );
      if (!res.ok) throw new Error('Failed to search articles');
      return res.json();
    },
    enabled: keyword.length > 1,
  });

  // Fetch popular articles
  const { data: popularArticles = [] } = useQuery({
    queryKey: ['kb-popular'],
    queryFn: async () => {
      const res = await fetch(`/api/knowledge-base/popular?limit=5`);
      if (!res.ok) throw new Error('Failed to fetch popular articles');
      return res.json();
    },
    enabled: showPopular && !keyword,
  });

  const handleSelectArticle = useCallback(
    (article: Article) => {
      if (onSelectArticle) {
        onSelectArticle(article);
      }
      setShowSuggestions(false);
      setKeyword('');
    },
    [onSelectArticle]
  );

  const filteredResults = selectedCategory
    ? searchResults.filter((article) => article.category === selectedCategory)
    : searchResults;

  const displayResults =
    keyword.length > 1 ? filteredResults.slice(0, maxResults) : [];

  return (
    <div className="w-full max-w-2xl">
      <div className="relative">
        {/* Search Input */}
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Cikkek keresése..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {keyword && (
            <button
              onClick={() => {
                setKeyword('');
                setShowSuggestions(false);
              }}
              className="absolute right-3 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && (keyword.length > 1 || !keyword) && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
            {isSearching && (
              <div className="p-4 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">Keresés...</span>
              </div>
            )}

            {!isSearching && displayResults.length > 0 && (
              <div className="divide-y">
                {displayResults.map((article) => (
                  <button
                    key={article.id}
                    onClick={() => handleSelectArticle(article)}
                    className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">
                      {article.title}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {article.category}
                    </div>
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {article.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-block text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {!isSearching &&
              keyword.length > 1 &&
              displayResults.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  Nincs találat "{keyword}"-re
                </div>
              )}

            {/* Popular Articles */}
            {!keyword && showPopular && popularArticles.length > 0 && (
              <div>
                <div className="p-4 border-t bg-gray-50 font-medium text-gray-900">
                  Népszerű cikkek
                </div>
                <div className="divide-y">
                  {popularArticles.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => handleSelectArticle(article)}
                      className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">
                        {article.title}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {article.category}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Filter (if categories available) */}
      {categories.length > 0 && (
        <div className="mt-4 flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              !selectedCategory
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Összes
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default KnowledgeBaseSearch;
