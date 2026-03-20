import React from 'react';
import { NewsReaderLayout } from '@/components/for-you';
import LoadingSkeleton from '@/components/ui/loading-skeleton';
import ErrorMessage from '@/components/ui/error-message';
import EmptyState from './EmptyState';
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
          icon="🎯"
          title="Your feed is being personalized"
          description={
            personalFeed.message ??
            "We're curating articles based on your interests. Check back soon or update your categories in Settings."
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
        showBadges={false}
        showCategory={false}
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
          description="We'll refresh this soon. Check back later."
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
        showCategory={false}
      />
    );
  };

  return (
    <div className="h-[calc(100vh-8rem)]">
      {personalSubTab === 'feed' ? renderForYou() : renderTrending()}
    </div>
  );
};

export default PersonalTabContent;
