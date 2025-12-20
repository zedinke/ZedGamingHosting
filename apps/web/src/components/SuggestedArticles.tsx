import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Lightbulb, Link as LinkIcon } from 'lucide-react';

interface SuggestedArticle {
  id: string;
  title: string;
  category: string;
  tags: string[];
  excerpt?: string;
}

interface SuggestedArticlesProps {
  ticketId: string;
  onSelectArticle?: (article: SuggestedArticle) => void;
  maxResults?: number;
  compact?: boolean;
}

export const SuggestedArticles: React.FC<SuggestedArticlesProps> = ({
  ticketId,
  onSelectArticle,
  maxResults = 5,
  compact = false,
}) => {
  const { data: suggestedArticles = [], isLoading, error } = useQuery({
    queryKey: ['kb-suggest', ticketId],
    queryFn: async () => {
      const res = await fetch(
        `/api/knowledge-base/suggest/${ticketId}?limit=${maxResults}`
      );
      if (!res.ok) throw new Error('Failed to fetch suggestions');
      return res.json() as Promise<SuggestedArticle[]>;
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
        <span className="ml-2 text-sm text-gray-600">Cikkek keresése...</span>
      </div>
    );
  }

  if (error || suggestedArticles.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Lightbulb className="w-4 h-4 text-yellow-500" />
          Hasznos cikkek
        </div>
        <div className="space-y-1">
          {suggestedArticles.map((article) => (
            <button
              key={article.id}
              onClick={() => onSelectArticle?.(article)}
              className="block w-full text-left text-sm p-2 rounded hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors"
            >
              {article.title}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-yellow-600" />
        <h3 className="font-semibold text-gray-900">Javasolt cikkek</h3>
      </div>

      <div className="space-y-3">
        {suggestedArticles.map((article) => (
          <div
            key={article.id}
            className="p-3 bg-white rounded border border-yellow-100 hover:shadow-md transition-shadow"
          >
            <button
              onClick={() => onSelectArticle?.(article)}
              className="w-full text-left group"
            >
              <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                {article.title}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {article.category}
              </div>
            </button>

            {article.tags && article.tags.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {article.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <button
              onClick={() => onSelectArticle?.(article)}
              className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <LinkIcon className="w-4 h-4" />
              Csatolás a jegyhez
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuggestedArticles;
