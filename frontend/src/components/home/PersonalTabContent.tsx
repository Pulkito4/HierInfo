import React from 'react';
import { NewsReaderLayout } from '@/components/for-you';
import LoadingSkeleton from '@/components/ui/loading-skeleton';
import ErrorMessage from '@/components/ui/error-message';
import EmptyState from './EmptyState';
import PersonalTabNavigation from './PersonalTabNavigation';
import { SKELETON_ARTICLES_COUNT } from '@/lib/constants';
import { isLoading } from '@/lib/utils/feedUtils';
import type { Article } from '@/types/articles';
import type { LoadingState } from '@/types/shared';

interface FeedData {
  articles: Article[];
  loading: LoadingState;
  error: Error | null;
  refetch: () => void;
  message?: string;
}

interface PersonalTabContentProps {
  personalSubTab: 'feed' | 'trending';
  onSubTabChange: (subTab: 'feed' | 'trending') => void;
  personalFeed: FeedData;
  trendingFeed: FeedData;
  criticalFeed: FeedData;
  onSettingsClick: () => void;
}

const PersonalTabContent: React.FC<PersonalTabContentProps> = ({
  personalSubTab,
  onSubTabChange,
  personalFeed,
  trendingFeed,
  criticalFeed,
  onSettingsClick,
}) => {
  const renderForYou = () => {
    if (personalFeed.error) {
      return <ErrorMessage error={personalFeed.error} onRetry={personalFeed.refetch} />;
    }

    if (personalFeed.articles.length === 0 && personalFeed.loading === 'success') {
      return (
        <EmptyState
          icon="📰"
          title="No articles to show"
          description={
            personalFeed.message ??
            "You're all caught up for today! Check back later, or adjust your categories in Settings to see more."
          }
          onRetry={personalFeed.refetch}
          primaryAction={{
            label: 'Update Categories',
            onClick: onSettingsClick,
          }}
        />
      );
    }

    return (
      <NewsReaderLayout
        articles={personalFeed.articles}
        loading={isLoading(personalFeed.loading)}
      />
    );
  };

  const renderTrending = () => {
    const allTrendingArticles = [
      ...criticalFeed.articles,
      ...trendingFeed.articles,
    ];
    
    const hasError = trendingFeed.error || criticalFeed.error;
    const isLoadingState = isLoading(trendingFeed.loading as LoadingState) && 
                          isLoading(criticalFeed.loading as LoadingState);

    if (isLoadingState && allTrendingArticles.length === 0) {
      return <LoadingSkeleton type="articles" count={SKELETON_ARTICLES_COUNT} />;
    }

    if (hasError) {
      return (
        <ErrorMessage
          error={trendingFeed.error || criticalFeed.error}
          onRetry={() => {
            trendingFeed.refetch();
            criticalFeed.refetch();
          }}
        />
      );
    }

    if (allTrendingArticles.length === 0) {
      return (
        <EmptyState
          icon="🔥"
          title="No trending stories right now"
          description="We'll refresh this soon. Try again in a bit."
          onRetry={() => {
            trendingFeed.refetch();
            criticalFeed.refetch();
          }}
        />
      );
    }

    return (
      <NewsReaderLayout
        articles={allTrendingArticles}
        loading={isLoadingState}
        showBadges={true}
      />
    );
  };

  return (
    <div className="space-y-1 bg-slate-950">
      <PersonalTabNavigation
        activeSubTab={personalSubTab}
        onSubTabChange={onSubTabChange}
      />
      {personalSubTab === 'feed' ? renderForYou() : renderTrending()}
    </div>
  );
};

export default PersonalTabContent;
