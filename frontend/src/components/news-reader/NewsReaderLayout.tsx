"use client";
import React, { useState, useEffect, useMemo } from 'react';
import type { Article } from '@/types/articles';
import ArticleList from './ArticleList';
import ArticleDetail from './ArticleDetail';
import MobileArticleSheet from './MobileArticleSheet';
import TrendingArticleCard from './TrendingArticleCard';
import { useIsMobile } from '@/hooks/use-mobile';

interface NewsReaderLayoutProps {
  articles: Article[];
  loading?: boolean;
  showBadges?: boolean; // New prop to control badge visibility
}

const NewsReaderLayout: React.FC<NewsReaderLayoutProps> = ({ articles, loading, showBadges = false }) => {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const isMobile = useIsMobile();

  // Get the first article ID to use as a stable dependency
  const firstArticleId = useMemo(() => articles[0]?.id, [articles]);

  // Auto-select first article on desktop when articles load or change (tab switch)
  useEffect(() => {
    if (!isMobile && articles.length > 0) {
      // Always select first article when articles change (tab switch)
      setSelectedArticle(articles[0]);
    }
  }, [firstArticleId, isMobile, articles]);

  // Desktop: Split View
  if (!isMobile) {
    return (
      <div className="flex gap-0 h-[calc(100vh-8rem)] bg-slate-950">
        {/* Left Panel - Article List (30%) */}
        <div className="w-[30%] min-w-[320px] max-w-[400px] overflow-y-auto border-r border-slate-800 bg-slate-900/50">
          <ArticleList
            articles={articles}
            selectedId={selectedArticle?.id}
            onSelect={setSelectedArticle}
            loading={loading}
            showBadges={showBadges}
          />
        </div>

        {/* Right Panel - Article Detail (70%) */}
        <div className="flex-1 overflow-y-auto bg-slate-950">
          <ArticleDetail article={selectedArticle} />
        </div>
      </div>
    );
  }

  // Mobile: Card Grid + Bottom Sheet
  return (
    <>
      <div className="grid grid-cols-1 gap-4 p-4 bg-slate-950">
        {loading ? (
          // Loading skeleton
          [...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg bg-slate-900 border border-slate-800 p-4">
              <div className="bg-slate-800 h-32 rounded-md mb-3" />
              <div className="bg-slate-800 h-4 rounded w-3/4 mb-2" />
              <div className="bg-slate-800 h-3 rounded w-1/2" />
            </div>
          ))
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-6xl mb-4">📰</div>
            <h3 className="text-lg font-semibold text-slate-50 mb-2">
              No articles available
            </h3>
            <p className="text-sm text-slate-400">
              Check back later for new stories
            </p>
          </div>
        ) : (
          articles.map((article) => (
            <div
              key={article.id}
              onClick={() => setSelectedArticle(article)}
              className="rounded-lg bg-slate-900 border border-slate-800 p-4 cursor-pointer hover:border-blue-500/50 transition-colors"
            >
              {article.image_url && (
                <div className="relative w-full h-40 mb-3 rounded-md overflow-hidden bg-slate-800">
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <h3 className="font-semibold text-slate-50 line-clamp-2 mb-2">
                {article.title}
              </h3>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium">{article.source}</span>
                <span>
                  {new Date(article.published_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mobile Bottom Sheet */}
      <MobileArticleSheet
        article={selectedArticle}
        open={!!selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </>
  );
};

export default NewsReaderLayout;
