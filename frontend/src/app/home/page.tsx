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
import { Separator } from '@/components/ui/separator';

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
        return 'For You';
      case 'explore':
        return 'Discover';
      case 'settings':
        return 'Settings';
      default:
        return '';
    }
  };

  const shouldRemovePadding = 
    activeTab === 'personal' && 
    (personalSubTab === 'feed' || personalSubTab === 'trending');

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <HomeSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 p-2 text-white bg-gradient-to-r from-slate-950 via-blue-950/90 to-slate-950 shrink-0 items-center gap-3 border-b border-blue-900/20 px-6 backdrop-blur-sm">
          <SidebarTrigger className="-ml-1 hover:bg-blue-900/20 rounded-lg transition-all" />
          <Separator orientation="vertical" className="h-6 bg-blue-800/30" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-100 via-white to-indigo-200 bg-clip-text text-transparent">
            {getHeaderTitle()}
          </h1>
        </header>
        <main className={`flex-1 bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950 overflow-auto ${shouldRemovePadding ? 'p-0' : 'p-6'}`}>
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
