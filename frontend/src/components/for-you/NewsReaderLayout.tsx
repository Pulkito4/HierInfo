"use client";
import React, { useState, useMemo } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Article } from '@/types/articles';
import ArticleDetail from './ArticleDetail';
import MobileArticleSheet from './MobileArticleSheet';
import { useIsMobile } from '@/hooks/use-mobile';
import ArticleCard from './ArticleCard';

interface NewsReaderLayoutProps {
  articles: Article[];
  loading?: boolean;
  showBadges?: boolean;
}

const NewsReaderLayout: React.FC<NewsReaderLayoutProps> = ({ articles, loading, showBadges: _showBadges = false }) => {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const isMobile = useIsMobile();

  const _firstArticleId = useMemo(() => articles[0]?.id, [articles]);

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
      <div className="flex h-[calc(100vh-8rem)] bg-[#FDFBF7]">
        {/* Left: Article Grid */}
        <div className="w-[55%] min-w-[400px] max-w-[800px] border-r border-[#E5E5E5] bg-[#FAFAFA] overflow-y-auto">
          <div className="p-6">
            {/* Grid Header */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-[#1A1A1A]">
                Latest Stories
              </h2>
              <p className="text-sm text-[#6B6B6B]">
                {articles.length} articles available
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
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right: Article Detail Panel */}
        <div className="flex-1 overflow-y-auto bg-white">
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
      <div className="bg-[#FDFBF7] min-h-screen">
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 bg-[#FDFBF7]/95 backdrop-blur-md border-b border-[#E5E5E5] px-4 py-3">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">
            Latest Stories
          </h2>
          <p className="text-sm text-[#6B6B6B]">
            {articles.length} articles available
          </p>
        </div>

        {/* Mobile Grid */}
        <div className="grid grid-cols-1 gap-4 p-4">
          {loading ? (
            // Loading skeleton
            [...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-[#E5E5E5] overflow-hidden">
                <div className="aspect-[16/10] bg-[#F5F5F4] animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-[#F5F5F4] rounded w-20 animate-pulse" />
                  <div className="h-5 bg-[#F5F5F4] rounded w-full animate-pulse" />
                  <div className="h-5 bg-[#F5F5F4] rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-[#F5F5F4] rounded w-24 animate-pulse" />
                </div>
              </div>
            ))
          ) : articles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-[#F5F5F4] rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-[#9CA3AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">
                No articles available
              </h3>
              <p className="text-sm text-[#6B6B6B]">
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
