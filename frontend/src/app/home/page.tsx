"use client";
import { 
  Sidebar, 
  SidebarProvider, 
  SidebarContent, 
  SidebarHeader, 
  SidebarInset,
  SidebarTrigger,
  useSidebar
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Earth, Settings, Smile, TrendingUp } from 'lucide-react';
import React, { useCallback, Suspense } from 'react'
import Image from 'next/image';
import AllTiles from '@/components/news-tiles/AllTiles';
import { useForYouFeed, useTrendingFeed, useExploreFeed } from '@/lib/react-query/feeds';
import { SKELETON_ARTICLES_COUNT, SKELETON_EXPLORE_COUNT } from '@/lib/constants';
import { useAuth } from '@/lib/authContext';
import LoadingSkeleton from '@/components/ui/loading-skeleton';
import ErrorMessage from '@/components/ui/error-message';
import SettingsPanel from '@/components/settings/SettingsPanel';
import ProtectedRoute from '@/components/ProtectedRoute';
import type { LoadingState } from '@/types/shared';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
const HomepageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // URL-based state management to prevent unnecessary re-renders
  const activeTab = (searchParams.get('tab') || 'personal') as 'personal' | 'explore' | 'settings';
  const personalSubTab = (searchParams.get('subTab') || 'feed') as 'feed' | 'trending';

  // Optimized navigation functions with shallow routing
  const setActiveTab = useCallback((tab: 'personal' | 'explore' | 'settings') => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', tab);
    if (tab === 'personal') {
      // Preserve existing subTab for personal, or default to 'feed'
      if (!params.get('subTab')) {
        params.set('subTab', 'feed');
      }
    } else {
      // Remove subTab for non-personal tabs
      params.delete('subTab');
    }
    router.push(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const setPersonalSubTab = useCallback((subTab: 'feed' | 'trending') => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', 'personal');
    params.set('subTab', subTab);
    router.push(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  // Hooks for different tabs
  const personalFeed = useForYouFeed(15);

  const trendingNews = useTrendingFeed(10);

  const exploreFeed = useExploreFeed(20);

  const PersonalTabNavigation = () => (
    <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6">
      <button
        onClick={() => setPersonalSubTab('feed')}
        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
          personalSubTab === 'feed'
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          <Smile size={16} />
          For You
        </div>
      </button>
      
      <button
        onClick={() => setPersonalSubTab('trending')}
        className={`flex-1 px-4 py-1 text-sm font-medium rounded-md transition-all ${
          personalSubTab === 'trending'
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          <TrendingUp size={16} />
          Trending
          {/* <Badge variant="destructive" className="text-xs">
            LIVE
          </Badge> */}
        </div>
      </button>
    </div>
  );



 const renderContent = () => {
  const isLoading = (state: LoadingState) => state === 'loading' || state === 'idle';
  
  switch (activeTab) {
    case 'personal':
      return (
        <div className="space-y-1">
          <PersonalTabNavigation />
          
          {personalSubTab === 'feed' ? (
            <div>
              {isLoading(personalFeed.loading) && personalFeed.articles.length === 0 ? (
                <LoadingSkeleton type="articles" count={SKELETON_ARTICLES_COUNT} />
              ) : personalFeed.error ? (
                <ErrorMessage error={personalFeed.error} onRetry={personalFeed.refetch} />
              ) : personalFeed.articles.length === 0 && personalFeed.loading === 'success' ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="text-center space-y-4">
                    <div className="text-6xl mb-4">📰</div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      No articles to show
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md">
                      {personalFeed.message ?? "You're all caught up for today! Check back later, or adjust your categories in Settings to see more."}
                    </p>
                    <div className="space-x-2">
                      <button
                        onClick={() => setActiveTab('settings')}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Update Categories
                      </button>
                      <button
                        onClick={() => personalFeed.refetch()}
                        className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold">Top Stories for You</h2>
                      {/* <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Based on your preferences
                      </p> */}
                    </div>
                    {/* <button 
                      onClick={personalFeed.refresh}
                      className="text-sm text-blue-600 hover:underline"
                      disabled={personalFeed.loading === 'loading'}
                    >
                      {personalFeed.loading === 'loading' ? 'Refreshing...' : 'Refresh'}
                    </button> */}
                  </div>
                  <AllTiles 
                    articles={personalFeed.articles}
                  />
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* <CriticalNewsIndicator /> */}
              {isLoading(trendingNews.loading as LoadingState) && trendingNews.articles.length === 0 ? (
                <LoadingSkeleton type="articles" count={SKELETON_ARTICLES_COUNT} />
              ) : trendingNews.error ? (
                <ErrorMessage error={trendingNews.error} onRetry={trendingNews.refetch} />
              ) : trendingNews.articles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="text-center space-y-4">
                    <div className="text-6xl mb-4">🔥</div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      No trending stories right now
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md">
                      We’ll refresh this soon. Try again in a bit.
                    </p>
                    <button
                      onClick={() => trendingNews.refetch()}
                      className="inline-flex items-center px-4 py-2 bg-gray-700 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold flex items-center gap-2">
                      Critical updates and trending stories
                        
                      </h2>
                     
                    </div>
                    {/* <button 
                      onClick={trendingNews.refresh}
                      className="text-sm text-red-600 hover:underline"
                      disabled={trendingNews.loading === 'loading'}
                    >
                      {trendingNews.loading === 'loading' ? 'Refreshing...' : 'Refresh'}
                    </button> */}
                  </div>
                  <AllTiles 
                    articles={trendingNews.articles}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      );

    case 'explore':
      if (isLoading(exploreFeed.loading as LoadingState) && exploreFeed.articles.length === 0) {
        return <LoadingSkeleton type="articles" count={SKELETON_EXPLORE_COUNT} />;
      }
      if (exploreFeed.error) {
        return <ErrorMessage error={exploreFeed.error} onRetry={exploreFeed.refetch} />;
      }
      if (exploreFeed.articles.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="text-center space-y-4">
              <div className="text-6xl mb-4">🧭</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Nothing to explore yet</h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md">We’ll curate fresh picks soon. Try again in a moment.</p>
              <button
                onClick={() => exploreFeed.refetch()}
                className="inline-flex items-center px-4 py-2 bg-gray-700 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        );
      }
      return (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Curated Shuffle</h2>
            {/* Add CategoryFilter component here when ready */}
          </div>
          <AllTiles 
            articles={exploreFeed.articles}
            onLoadMore={exploreFeed.fetchMore}
            hasMore={exploreFeed.hasMore}
            loading={exploreFeed.loading === 'loading'}
            infiniteScroll
          />
        </div>
      );

    case 'settings':
      return <div><SettingsPanel /></div>; // Placeholder for now
  }
};

  // Sidebar content component that can use the useSidebar hook
  const SidebarContentComponent = () => {
    const { state, isMobile } = useSidebar();
    const isCollapsed = state === 'collapsed' && !isMobile; // Never collapse on mobile

    return (
      <>
        <SidebarHeader>
          <div className="flex items-center py-3 px-2">
            <Image 
              src="/logoicon.png" 
              alt="HeirInfo Logo" 
              width={40} 
              height={40} 
              className="flex-shrink-0"
            />
            {!isCollapsed && (
              <h2 className="text-2xl font-sans font-bold text-white ml-2">
                HeirInfo
              </h2>
            )}
          </div>
        </SidebarHeader>
        <hr className='border-white/70'/>
        <SidebarContent className="flex flex-col justify-between h-full">
          <div className="p-2 space-y-2">
            {/* For You Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setActiveTab('personal')}
                  className={`w-full flex items-center gap-3 p-3 rounded-md transition-all ${
                    activeTab === 'personal' 
                      ? 'bg-slate-600/70 text-white' 
                      : 'text-white hover:bg-slate-600/40'
                  }`}
                >
                  <Smile className="text-[#5B87F8] flex-shrink-0" size={20} />
                  {!isCollapsed && (
                    <span className="font-sans font-semibold">
                      For You
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">
                  For You
                </TooltipContent>
              )}
            </Tooltip>

            {/* Discover Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setActiveTab('explore')}
                  className={`w-full flex items-center gap-3 p-3 rounded-md transition-all ${
                    activeTab === 'explore'
                      ? 'bg-slate-600/70 text-white'
                      : 'text-white hover:bg-slate-600/40'
                  }`}
                >
                  <Earth className="text-[#49E8C6] flex-shrink-0" size={20} />
                  {!isCollapsed && (
                    <span className="font-sans font-semibold">
                      Discover
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">
                  Discover
                </TooltipContent>
              )}
            </Tooltip>
          </div>

          {/* Settings at bottom */}
          <div className="p-2 border-t border-white/20">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center gap-3 p-3 rounded-md transition-all ${
                    activeTab === 'settings'
                      ? 'bg-slate-600/70 text-white'
                      : 'text-white hover:bg-slate-600/40'
                  }`}
                >
                  <Settings className="text-[#E0E7FF] flex-shrink-0" size={20} />
                  {!isCollapsed && (
                    <span className="font-sans font-semibold">
                      Settings
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">
                  Settings
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </SidebarContent>
      </>
    );
  };

  return (
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarContentComponent />
        </Sidebar>
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-xl font-semibold">
              {activeTab === 'personal' ? 'For You' : 
               activeTab === 'explore' ? 'Discover' : 'Settings'}
            </h1>
          </header>
          <main className="flex-1 overflow-auto p-6">
            {renderContent()}
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