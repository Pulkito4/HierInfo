"use client";
import React, { Suspense } from 'react';
import { 
  Sidebar, 
  SidebarProvider, 
  SidebarInset,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { useForYouFeed, useTrendingFeed, useExploreFeed, useCriticalFeed } from '@/lib/react-query/feeds';
import { SKELETON_ARTICLES_COUNT } from '@/lib/constants';
import LoadingSkeleton from '@/components/ui/loading-skeleton';
import SettingsPanel from '@/components/settings/SettingsPanel';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useTabNavigation } from '@/hooks/useTabNavigation';
import HomeSidebar from '@/components/home/HomeSidebar';
import PersonalTabContent from '@/components/home/PersonalTabContent';
import ExploreTabContent from '@/components/home/ExploreTabContent';

const HomepageContent = () => {
  const { activeTab, personalSubTab, setActiveTab, setPersonalSubTab } = useTabNavigation();

  // Fetch data for all tabs
  const personalFeed = useForYouFeed(15);
  const trendingFeed = useTrendingFeed(10);
  const criticalFeed = useCriticalFeed(10);
  const exploreFeed = useExploreFeed(20);

  const renderContent = () => {
    switch (activeTab) {
      case 'personal':
        return (
          <PersonalTabContent
            personalSubTab={personalSubTab}
            onSubTabChange={setPersonalSubTab}
            personalFeed={personalFeed}
            trendingFeed={trendingFeed}
            criticalFeed={criticalFeed}
            onSettingsClick={() => setActiveTab('settings')}
          />
        );

      case 'explore':
        return (
          <ExploreTabContent
            articles={exploreFeed.articles}
            loading={exploreFeed.loading}
            error={exploreFeed.error}
            hasMore={exploreFeed.hasMore}
            onLoadMore={exploreFeed.fetchMore}
            onRetry={exploreFeed.refetch}
          />
        );

      case 'settings':
        return <SettingsPanel />;

      default:
        return null;
    }
  };

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'personal':
        return personalSubTab === 'feed' ? 'For You' : 'Trending';
      case 'explore':
        return 'Discover';
      case 'settings':
        return 'Settings';
      default:
        return '';
    }
  };

  const getHeaderDescription = () => {
    switch (activeTab) {
      case 'personal':
        return personalSubTab === 'feed' 
          ? 'Personalized news based on your interests' 
          : 'Most popular stories right now';
      case 'explore':
        return 'Discover stories from around the world';
      case 'settings':
        return 'Manage your preferences and account';
      default:
        return '';
    }
  };

  const shouldRemovePadding = 
    activeTab === 'personal' && 
    (personalSubTab === 'feed' || personalSubTab === 'trending');

  return (
    <SidebarProvider>
      <Sidebar 
        collapsible="icon" 
        className="border-r border-[#E5E5E5] bg-[#FAFAFA]"
      >
        <HomeSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      </Sidebar>
      <SidebarInset className="bg-[#FDFBF7]">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-[#E5E5E5] bg-white/95 backdrop-blur-md px-4 lg:px-6">
          <SidebarTrigger className="-ml-1 hover:bg-[#F5F5F4] rounded-lg transition-colors" />
          
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-[#1A1A1A] truncate">
              {getHeaderTitle()}
            </h1>
            <p className="text-xs text-[#6B6B6B] hidden sm:block">
              {getHeaderDescription()}
            </p>
          </div>

          {/* Tab Navigation for Personal */}
          {activeTab === 'personal' && (
            <div className="hidden sm:flex items-center gap-1 bg-[#F5F5F4] rounded-lg p-1">
              <button
                onClick={() => setPersonalSubTab('feed')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  personalSubTab === 'feed'
                    ? 'bg-white text-[#1A1A1A] shadow-sm'
                    : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                }`}
              >
                For You
              </button>
              <button
                onClick={() => setPersonalSubTab('trending')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  personalSubTab === 'trending'
                    ? 'bg-white text-[#1A1A1A] shadow-sm'
                    : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                }`}
              >
                Trending
              </button>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className={`flex-1 overflow-auto ${shouldRemovePadding ? 'p-0' : 'p-4 lg:p-6'}`}>
          <div className={shouldRemovePadding ? '' : 'max-w-7xl mx-auto'}>
            {renderContent()}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

const Homepage = () => {
  return (
    <ProtectedRoute>
      <Suspense fallback={<LoadingSkeleton type="articles" count={SKELETON_ARTICLES_COUNT} />}>
        <HomepageContent />
      </Suspense>
    </ProtectedRoute>
  );
};

export default Homepage;
