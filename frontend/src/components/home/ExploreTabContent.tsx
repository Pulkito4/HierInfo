'use client';

import React, { useState, useRef, useCallback } from 'react';
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
  hasMore,
  onLoadMore,
  onRetry,
}) => {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { trackActivity } = useArticleActivity(selectedArticle?.id || '');
  const observerTarget = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries;
    if (target.isIntersecting && hasMore && !isLoading(loading)) {
      onLoadMore();
    }
  }, [hasMore, loading, onLoadMore]);

  React.useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: '100px',
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);

  const handleArticleClick = (article: Article) => {
    setSelectedArticle(article);
    setIsSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
    setTimeout(() => setSelectedArticle(null), 300);
  };

  const handleLike = (_articleId: string) => {
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

  const heroArticles = articles.slice(0, 5);
  const gridArticles = articles.slice(5);

  return (
    <>
      <div className="space-y-8">
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
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-[#1A1A1A]">
                More Stories
              </h2>
              <div className="flex-1 h-px bg-[#E5E5E5]" />
            </div>
            <DiscoverGrid
              articles={gridArticles}
              onArticleClick={handleArticleClick}
            />
          </div>
        )}

        {/* Infinite Scroll Trigger */}
        <div ref={observerTarget} className="h-20 flex items-center justify-center">
          {isLoading(loading) && hasMore && (
            <div className="flex items-center gap-2 text-[#6B6B6B]">
              <div className="w-5 h-5 border-2 border-[#D4D4D4] border-t-[#1A1A1A] rounded-full animate-spin" />
              <span className="text-sm font-medium">Loading more stories...</span>
            </div>
          )}
          {!hasMore && articles.length > 0 && (
            <p className="text-sm text-[#9CA3AF]">You&apos;ve reached the end</p>
          )}
        </div>
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
