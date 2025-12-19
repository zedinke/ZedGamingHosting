'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ThumbsUp, ThumbsDown, Copy, Share2, AlertCircle } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  tags: string[];
  views: number;
  helpful: number;
  notHelpful: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RelatedArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
}

export default function ArticleDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const locale = params.locale as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userFeedback, setUserFeedback] = useState<'helpful' | 'not-helpful' | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/knowledge-base/${slug}`);
        if (!response.ok) {
          throw new Error('Cikk nem található');
        }
        const data = await response.json();
        setArticle(data);

        // Fetch related articles
        if (data.id) {
          const relatedRes = await fetch(`/api/knowledge-base/${data.id}/related`);
          if (relatedRes.ok) {
            const related = await relatedRes.json();
            setRelatedArticles(related);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Hiba történt a cikk betöltésekor');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchArticle();
    }
  }, [slug]);

  const handleFeedback = async (type: 'helpful' | 'not-helpful') => {
    if (!article) return;

    try {
      const response = await fetch(`/api/knowledge-base/${article.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        setUserFeedback(type);
        setFeedbackSubmitted(true);
        setTimeout(() => setFeedbackSubmitted(false), 3000);
      }
    } catch (err) {
      console.error('Feedback error:', err);
    }
  };

  const copyToClipboard = () => {
    if (article) {
      navigator.clipboard.writeText(
        `${window.location.origin}/${locale}/knowledge-base/${article.slug}`
      );
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    }
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

  if (error || !article) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link href={`/${locale}/knowledge-base`} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8">
            <ArrowLeft size={20} />
            Vissza a tudásbázishoz
          </Link>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex gap-4">
              <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
              <div>
                <h2 className="text-lg font-semibold text-red-900">Hiba</h2>
                <p className="text-red-700 mt-1">{error || 'A cikk nem található'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Back Button */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 max-w-3xl py-4">
          <Link href={`/${locale}/knowledge-base`} className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
            <ArrowLeft size={20} />
            Vissza a tudásbázishoz
          </Link>
        </div>
      </div>

      {/* Article Content */}
      <div className="container mx-auto px-4 max-w-3xl py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/${locale}/knowledge-base?category=${article.category.slug}`} className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block">
            {article.category.name}
          </Link>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">{article.title}</h1>
          <p className="text-lg text-slate-600 mb-4">{article.excerpt}</p>

          <div className="flex items-center justify-between py-4 border-t border-b border-slate-200">
            <div className="flex items-center gap-6 text-sm text-slate-600">
              <span>👁 {article.views} nézet</span>
              <span>📅 {new Date(article.createdAt).toLocaleDateString('hu-HU')}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyToClipboard}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
                title="Hivatkozás másolása"
              >
                <Copy size={20} className="text-slate-600" />
              </button>
              <button
                className="p-2 hover:bg-slate-100 rounded-lg transition"
                title="Megosztás"
              >
                <Share2 size={20} className="text-slate-600" />
              </button>
            </div>
          </div>

          {copiedToClipboard && (
            <div className="mt-2 text-sm text-green-600 flex items-center gap-2">
              ✓ Hivatkozás másolva a vágólapra!
            </div>
          )}
        </div>

        {/* Content */}
        <div className="prose prose-slate max-w-none mb-12">
          <div
            className="text-slate-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mb-8 pb-8 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Címkék:</h3>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/${locale}/knowledge-base?q=${encodeURIComponent(tag)}`}
                  className="text-sm bg-slate-100 text-slate-700 px-3 py-1 rounded-full hover:bg-slate-200 transition"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Feedback */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-12">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Hasznos volt a cikk?</h3>
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleFeedback('helpful')}
              disabled={feedbackSubmitted}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                userFeedback === 'helpful'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              } ${feedbackSubmitted ? 'cursor-not-allowed opacity-75' : ''}`}
            >
              <ThumbsUp size={20} />
              Igen ({article.helpful})
            </button>
            <button
              onClick={() => handleFeedback('not-helpful')}
              disabled={feedbackSubmitted}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                userFeedback === 'not-helpful'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              } ${feedbackSubmitted ? 'cursor-not-allowed opacity-75' : ''}`}
            >
              <ThumbsDown size={20} />
              Nem ({article.notHelpful})
            </button>
          </div>
          {feedbackSubmitted && (
            <p className="text-sm text-green-600 mt-3">✓ Köszönjük a visszajelzést!</p>
          )}
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Kapcsolódó cikkek</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedArticles.map((related) => (
                <Link
                  key={related.id}
                  href={`/${locale}/knowledge-base/${related.slug}`}
                  className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md hover:border-blue-200 border-2 border-transparent transition"
                >
                  <h4 className="font-semibold text-slate-900 hover:text-blue-600 mb-2">
                    {related.title}
                  </h4>
                  <p className="text-sm text-slate-600 line-clamp-2">{related.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
