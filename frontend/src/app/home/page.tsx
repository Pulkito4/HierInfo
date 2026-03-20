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
import { Heart, Compass, Settings, TrendingUp } from 'lucide-react';

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

  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'personal':
        return {
          icon: personalSubTab === 'feed' ? Heart : TrendingUp,
          title: personalSubTab === 'feed' ? 'For You' : 'Trending',
          subtitle: personalSubTab === 'feed' 
            ? 'Stories picked just for you' 
            : 'What everyone is reading'
        };
      case 'explore':
        return {
          icon: Compass,
          title: 'Discover',
          subtitle: 'Find something new'
        };
      case 'settings':
        return {
          icon: Settings,
          title: 'Settings',
          subtitle: 'Manage your account'
        };
      default:
        return { icon: Heart, title: '', subtitle: '' };
    }
  };

  const headerInfo = getHeaderInfo();
  const HeaderIcon = headerInfo.icon;

  return (
    <SidebarProvider>
      <Sidebar 
        collapsible="icon" 
        className="border-r border-slate-200 bg-white"
      >
        <HomeSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      </Sidebar>
      <SidebarInset className="bg-[#FFFBF5]">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 lg:px-6">
          <SidebarTrigger className="-ml-1 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 p-2" />
          
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-coral/20 to-coral-light/20 flex items-center justify-center border border-coral/30">
              <HeaderIcon className="w-5 h-5 text-coral" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-slate-800 truncate">
                {headerInfo.title}
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block truncate">
                {headerInfo.subtitle}
              </p>
            </div>
          </div>

          {/* Sub-tab navigation for Personal */}
          {activeTab === 'personal' && (
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 border border-slate-200">
              <button
                onClick={() => setPersonalSubTab('feed')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  personalSubTab === 'feed'
                    ? 'bg-gradient-to-r from-coral to-coral-light text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200'
                }`}
              >
                For You
              </button>
              <button
                onClick={() => setPersonalSubTab('trending')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  personalSubTab === 'trending'
                    ? 'bg-gradient-to-r from-coral to-coral-light text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200'
                }`}
              >
                Trending
              </button>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
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
