'use client';

import React, { useState } from 'react';
import LoadingSkeleton from '@/components/ui/loading-skeleton';
import ErrorMessage from '@/components/ui/error-message';
import EmptyState from './EmptyState';
import { HeroBanner, DiscoverGrid, ArticleDrawer } from '../discover';
import { SKELETON_EXPLORE_COUNT } from '@/lib/constants';
import { isLoading } from '@/lib/utils/feedUtils';
import { useArticleActivity } from '@/hooks/useArticleActivity';
import type { Article } from '@/types/articles';
import type { LoadingState } from '@/types/shared';

interface ExploreTabContentProps {
  articles: Article[];
  loading: LoadingState;
  error: Error | null;
  hasMore: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
}

const ExploreTabContent: React.FC<ExploreTabContentProps> = ({
  articles,
  loading,
  error,
  onRetry,
}) => {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { trackActivity } = useArticleActivity(selectedArticle?.id || '');

  const handleArticleClick = (article: Article) => {
    setSelectedArticle(article);
    setIsSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
    setTimeout(() => setSelectedArticle(null), 300);
  };

  const handleLike = (articleId: string) => {
    trackActivity('like');
  };

  if (isLoading(loading) && articles.length === 0) {
    return <LoadingSkeleton type="articles" count={SKELETON_EXPLORE_COUNT} />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={onRetry} />;
  }

  if (articles.length === 0) {
    return (
      <EmptyState
        icon="🧭"
        title="Nothing to explore yet"
        description="We'll curate fresh picks soon. Try again in a moment."
        onRetry={onRetry}
      />
    );
  }

  // Split articles: first 5 for hero, rest for grid
  const heroArticles = articles.slice(0, 5);
  const gridArticles = articles.slice(5);

  return (
    <>
      <div className="space-y-10 p-4  lg:p-6">
      
        {/* Hero Banner */}
        <div className="relative">
          <HeroBanner
            articles={heroArticles}
            onArticleClick={handleArticleClick}
            onLike={handleLike}
          />
        </div>

        {/* Grid of Cards */}
        {gridArticles.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-100 via-white to-indigo-200 bg-clip-text text-transparent">
                More Stories
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-slate-800/50 to-slate-950" />
            </div>
            <DiscoverGrid
              articles={gridArticles}
              onArticleClick={handleArticleClick}
            />
          </div>
        )}
      </div>

      {/* Article Drawer (Right Side) */}
      <ArticleDrawer
        article={selectedArticle}
        open={isSheetOpen}
        onClose={handleCloseSheet}
      />
    </>
  );
};

export default ExploreTabContent;
