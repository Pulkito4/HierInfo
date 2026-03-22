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
      <div className="flex h-[calc(100vh-8rem)] bg-gradient-to-br from-[#101317] via-[#0d1218] to-[#0a0f15] text-zinc-100">
        {/* Left: Article Grid */}
        <div className="w-[55%] min-w-[400px] max-w-[800px] border-r border-[#2a3444]/60 bg-[#111821]/80 overflow-y-auto backdrop-blur-sm">
          <div className="p-6">
            {/* Grid Header */}
            <div className="mb-6 rounded-2xl border border-[#2a3444]/70 bg-[#141c27]/70 px-4 py-3 shadow-[0_12px_30px_-20px_rgba(0,0,0,0.8)]">
              <h2 className="text-lg font-bold text-zinc-100 tracking-tight">
                {articles.length} Articles
              </h2>
              <p className="text-sm text-zinc-400">
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
        <div className="flex-1 overflow-y-auto bg-[#0f141b]/55">
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
      <div className="min-h-screen bg-gradient-to-b from-[#101317] via-[#0d1218] to-[#0a0f15] text-zinc-100">
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 border-b border-[#2a3444]/60 bg-[#0f151d]/85 px-4 py-4 backdrop-blur-md">
          <h2 className="text-lg font-bold text-zinc-100 tracking-tight">
            {articles.length} Articles
          </h2>
          <p className="text-sm text-zinc-400">
            Tap to read full story
          </p>
        </div>

        {/* Mobile Grid */}
        <div className="grid grid-cols-1 gap-4 p-4">
          {loading ? (
            // Loading skeleton
            [...Array(5)].map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-[#2a3444]/60 bg-[#141c27]/70 shadow-[0_18px_35px_-24px_rgba(0,0,0,0.95)]">
                <div className="aspect-[16/10] animate-pulse bg-[#223043]/65" />
                <div className="p-4 space-y-3">
                  <div className="h-4 w-16 animate-pulse rounded bg-[#223043]/65" />
                  <div className="h-5 w-full animate-pulse rounded bg-[#223043]/65" />
                  <div className="h-5 w-3/4 animate-pulse rounded bg-[#223043]/65" />
                  <div className="h-3 w-24 animate-pulse rounded bg-[#223043]/65" />
                </div>
              </div>
            ))
          ) : articles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#2a3444]/70 bg-[#141c27]">
                <svg className="h-8 w-8 text-cyan-300/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-zinc-100">
                No articles available
              </h3>
              <p className="text-sm text-zinc-400">
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
