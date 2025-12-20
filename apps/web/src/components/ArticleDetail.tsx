import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ChevronLeft, ExternalLink } from 'lucide-react';

interface LinkedTicket {
  id: string;
  title: string;
  status: string;
}

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isPublished: boolean;
  linkedTickets: LinkedTicket[];
  createdAt: string;
  updatedAt: string;
}

interface ArticleDetailProps {
  articleId: string;
  onBack?: () => void;
  showLinkedTickets?: boolean;
}

export const ArticleDetail: React.FC<ArticleDetailProps> = ({
  articleId,
  onBack,
  showLinkedTickets = true,
}) => {
  const [article, setArticle] = useState<Article | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['kb-article', articleId],
    queryFn: async () => {
      const res = await fetch(`/api/knowledge-base/articles/${articleId}`);
      if (!res.ok) throw new Error('Failed to fetch article');
      return res.json() as Promise<Article>;
    },
  });

  useEffect(() => {
    if (data) {
      setArticle(data);
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Cikk betöltése...</span>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 font-medium">
          Hiba a cikk betöltésénél
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Vissza
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header with back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center text-blue-500 hover:text-blue-700 mb-6"
        >
          <ChevronLeft className="w-5 h-5" />
          Vissza
        </button>
      )}

      {/* Article Title */}
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        {article.title}
      </h1>

      {/* Metadata */}
      <div className="flex flex-wrap gap-4 mb-6 pb-6 border-b border-gray-200">
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-700">Kategória:</span>
          <span className="ml-2 text-sm text-gray-600">{article.category}</span>
        </div>
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-700">Frissítve:</span>
          <span className="ml-2 text-sm text-gray-600">
            {new Date(article.updatedAt).toLocaleDateString('hu-HU')}
          </span>
        </div>
      </div>

      {/* Tags */}
      {article.tags && article.tags.length > 0 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="inline-block text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Article Content */}
      <div className="prose prose-sm max-w-none mb-8 text-gray-700 whitespace-pre-wrap">
        {article.content}
      </div>

      {/* Linked Tickets */}
      {showLinkedTickets && article.linkedTickets && article.linkedTickets.length > 0 && (
        <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Kapcsolódó jegyek ({article.linkedTickets.length})
          </h3>
          <div className="space-y-3">
            {article.linkedTickets.slice(0, 5).map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between p-3 bg-white rounded border border-gray-200 hover:bg-blue-50 transition-colors"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {ticket.title}
                  </div>
                  <div className="text-sm text-gray-600">
                    Státusz:{' '}
                    <span className={`font-medium ${
                      ticket.status === 'CLOSED'
                        ? 'text-green-600'
                        : ticket.status === 'IN_PROGRESS'
                          ? 'text-blue-600'
                          : 'text-gray-600'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                </div>
                <a
                  href={`/dashboard/support/${ticket.id}`}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            ))}
            {article.linkedTickets.length > 5 && (
              <div className="text-sm text-gray-600 text-center pt-2">
                +{article.linkedTickets.length - 5} további jegy
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleDetail;
