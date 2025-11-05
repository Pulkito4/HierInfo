'use client';

import React, { useState } from 'react';
import LoadingSkeleton from '@/components/ui/loading-skeleton';
import ErrorMessage from '@/components/ui/error-message';
import EmptyState from './EmptyState';
import { HeroBanner, DiscoverGrid, ArticleDrawer } from './discover';
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
  hasMore,
  onLoadMore,
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
      <div className="space-y-8 bg-slate-900">
        {/* Hero Banner */}
        <HeroBanner
          articles={heroArticles}
          onArticleClick={handleArticleClick}
          onLike={handleLike}
        />

        {/* Grid of Cards */}
        {gridArticles.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-50 mb-6">More Stories</h2>
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
