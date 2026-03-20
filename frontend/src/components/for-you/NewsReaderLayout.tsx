"use client";
import React, { useState, useMemo } from 'react';
import type { Article } from '@/types/articles';
import ArticleDetail from './ArticleDetail';
import MobileArticleSheet from './MobileArticleSheet';
import { useIsMobile } from '@/hooks/use-mobile';
import ArticleCard from './ArticleCard';

interface NewsReaderLayoutProps {
  articles: Article[];
  loading?: boolean;
  showBadges?: boolean;
  showCategory?: boolean;
}

const NewsReaderLayout: React.FC<NewsReaderLayoutProps> = ({ 
  articles, 
  loading, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showBadges = false,
  showCategory = false
}) => {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const isMobile = useIsMobile();

  const currentIndex = useMemo(() => {
    if (!selectedArticle) return -1;
    return articles.findIndex(a => a.id === selectedArticle.id);
  }, [selectedArticle, articles]);

  const handleNext = () => {
    if (currentIndex < articles.length - 1) {
      setSelectedArticle(articles[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setSelectedArticle(articles[currentIndex - 1]);
    }
  };

  // Desktop: Two-column grid + detail panel
  if (!isMobile) {
    return (
      <div className="flex h-[calc(100vh-8rem)] bg-[#FFFBF5]">
        {/* Left: Article Grid */}
        <div className="w-[55%] min-w-[400px] max-w-[800px] border-r border-slate-200 bg-[#FFFBF5] overflow-y-auto">
          <div className="p-6">
            {/* Grid Header */}
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-800">
                {articles.length} Articles
              </h2>
              <p className="text-sm text-slate-500">
                Click to read full story
              </p>
            </div>

            {/* Article Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {articles.map((a) => (
                <ArticleCard
                  key={a.id}
                  article={a}
                  isSelected={selectedArticle?.id === a.id}
                  onClick={() => setSelectedArticle(a)}
                  showCategory={showCategory}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right: Article Detail Panel */}
        <div className="flex-1 overflow-y-auto bg-[#FFFBF5]">
          <ArticleDetail
            article={selectedArticle}
            onNext={handleNext}
            onPrevious={handlePrevious}
            hasNext={currentIndex < articles.length - 1}
            hasPrevious={currentIndex > 0}
          />
        </div>
      </div>
    );
  }

  // Mobile: Card Grid + Bottom Sheet
  return (
    <>
      <div className="bg-[#FFFBF5] min-h-screen">
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-4">
          <h2 className="text-lg font-bold text-slate-800">
            {articles.length} Articles
          </h2>
          <p className="text-sm text-slate-500">
            Tap to read full story
          </p>
        </div>

        {/* Mobile Grid */}
        <div className="grid grid-cols-1 gap-4 p-4">
          {loading ? (
            // Loading skeleton
            [...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="aspect-[16/10] bg-slate-200 animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-16 animate-pulse" />
                  <div className="h-5 bg-slate-200 rounded w-full animate-pulse" />
                  <div className="h-5 bg-slate-200 rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-slate-200 rounded w-24 animate-pulse" />
                </div>
              </div>
            ))
          ) : articles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                No articles available
              </h3>
              <p className="text-sm text-slate-500">
                Check back later for new stories
              </p>
            </div>
          ) : (
            articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                isSelected={selectedArticle?.id === article.id}
                onClick={() => setSelectedArticle(article)}
                showCategory={showCategory}
              />
            ))
          )}
        </div>
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
