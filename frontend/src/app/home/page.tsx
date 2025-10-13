"use client";
import { 
  Sidebar, 
  SidebarProvider, 
  SidebarContent, 
  SidebarHeader, 
  SidebarInset,
  SidebarTrigger 
} from '@/components/ui/sidebar'
import { Earth, Settings, Smile, TrendingUp } from 'lucide-react';
import React, { useState } from 'react'
import Image from 'next/image';
import AllTiles from '@/components/news-tiles/AllTiles';
import { useArticles, useUserFeed } from '@/hooks/useArticles';
import { useAuth } from '@/lib/authContext';
import LoadingSkeleton from '@/components/ui/loading-skeleton';
import ErrorMessage from '@/components/ui/error-message';
import { LoadingState } from '@/types';
import SettingsPanel from '@/components/settings/SettingsPanel';
import ProtectedRoute from '@/components/ProtectedRoute';
const Homepage = () => {
  const [activeTab, setActiveTab] = useState<'personal' | 'explore' | 'settings'>('personal');
  const [personalSubTab, setPersonalSubTab] = useState<'feed' | 'trending'>('feed');
  const { user } = useAuth();

  // Hooks for different tabs
  const personalFeed = useUserFeed(user?.id || null, {
    enabled: activeTab === 'personal' && personalSubTab === 'feed' && !!user?.id,
    limit: 15
  });

  const trendingNews = useArticles({
    enabled: activeTab === 'personal' && personalSubTab === 'trending',
    limit: 20,
    onlyCritical: true,
    sortBy: 'published_at',
    sortOrder: 'desc'
  });

  const exploreArticles = useArticles({
    enabled: activeTab === 'explore',
    limit: 20,
    sortBy: 'trending_score',
    sortOrder: 'desc'
  });

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
                <LoadingSkeleton type="articles" count={6} />
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
                      We couldn&apos;t find any articles matching your selected categories. Try adding more categories in your settings or check back later for new content.
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
                    onLoadMore={personalFeed.fetchMore}
                    hasMore={personalFeed.hasMore}
                    loading={personalFeed.loading === 'loading'}
                  />
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* <CriticalNewsIndicator /> */}
              {isLoading(trendingNews.loading) && trendingNews.articles.length === 0 ? (
                <LoadingSkeleton type="articles" count={6} />
              ) : trendingNews.error ? (
                <ErrorMessage error={trendingNews.error} onRetry={trendingNews.refetch} />
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
                    onLoadMore={trendingNews.fetchMore}
                    hasMore={trendingNews.hasMore}
                    loading={trendingNews.loading === 'loading'}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      );

    case 'explore':
      if (isLoading(exploreArticles.loading) && exploreArticles.articles.length === 0) {
        return <LoadingSkeleton type="articles" count={8} />;
      }
      if (exploreArticles.error) {
        return <ErrorMessage error={exploreArticles.error} onRetry={exploreArticles.refetch} />;
      }
      return (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Trending & Latest</h2>
            {/* Add CategoryFilter component here when ready */}
          </div>
          <AllTiles 
            articles={exploreArticles.articles}
            onLoadMore={exploreArticles.fetchMore}
            hasMore={exploreArticles.hasMore}
            loading={exploreArticles.loading === 'loading'}
          />
        </div>
      );

    case 'settings':
      return <div><SettingsPanel /></div>; // Placeholder for now
  }
};

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <h2 className="text-2xl font-sans font-bold text-white text-left py-3">
              <span>
                <Image src="/logoicon.png" alt="HeirInfo Logo" width={50} height={50} className="inline-block mr-2" />
              </span>
              HeirInfo
            </h2>
          </SidebarHeader>
          <hr className='border-white/70'/>
          <SidebarContent className="flex flex-col justify-between h-full">
            <div className="p-2 space-y-2">
              <button
                onClick={() => setActiveTab('personal')}
                className={`w-full text-left p-2 rounded-md ${
                  activeTab === 'personal' ? 'bg-slate-600/70 text-white' : ' text-white'
                }`}
              >
                <div className='flex items-center font-sans font-semibold gap-2'>
                  <Smile className=' text-[#5B87F8]' />
                  For You
                </div>
              </button>

              <button
                onClick={() => setActiveTab('explore')}
                className={`w-full text-left p-2 rounded-md ${
                  activeTab === 'explore' ? 'bg-slate-600/70 text-white' : ' text-white'
                }`}
              >
                <div className='flex items-center font-sans font-semibold gap-2'>
                  <Earth className=' text-[#49E8C6]'/>
                  Discover
                </div>
              </button>
            </div>

            <div className="p-2 border-t">
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full text-left p-2 rounded-md ${
                  activeTab === 'settings' ? 'bg-slate-600/70 text-white' : ' text-white'
                }`}
              >
                <div className='flex items-center font-sans font-semibold gap-2'>
                  <Settings className=' text-[#E0E7FF]'/>
                  Settings
                  
                </div>
              </button>
            </div>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
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
    </ProtectedRoute>
  );
};

export default Homepage;