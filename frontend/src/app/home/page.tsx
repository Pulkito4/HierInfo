"use client";

import { 
  Sidebar, 
  SidebarProvider, 
  SidebarContent, 
  SidebarHeader, 
  SidebarInset,
  SidebarTrigger 
} from '@/components/ui/sidebar'
import { Earth, Settings, Smile } from 'lucide-react';
import React, { useState } from 'react'
import Image from 'next/image';

const Homepage = () => {
  const [activeTab, setActiveTab] = useState<'personal' | 'explore' | 'settings'>('personal');

  const renderContent = () => {
    switch (activeTab) {
      case 'personal':
        return (
          <>
            <h2 className="text-2xl font-bold mb-4">Personal Feed</h2>
            <p>Your personalized news articles based on your preferences.</p>
          </>
        );
      case 'explore':
        return (
          <>
            <h2 className="text-2xl font-bold mb-4">Open Exploration</h2>
            <p>Discover trending or new articles beyond your feed.</p>
          </>
        );
      case 'settings':
        return (
          <>
            <h2 className="text-2xl font-bold mb-4">Settings</h2>
            <p>Manage your preferences, account, and notifications.</p>
          </>
        );
    }
  };

  return (
    <SidebarProvider >
      <Sidebar >
        <SidebarHeader>
          <h2 className="text-2xl font-sans font-bold text-white text-left py-3"><span>
            <Image src="/logoicon.png" alt="HeirInfo Logo" width={50} height={50} className="inline-block mr-2" />
            </span>HeirInfo</h2>
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
            {activeTab === 'personal'
              ? 'Top Stories for you'
              : activeTab === 'explore'
              ? 'Open Exploration'
              : 'Settings'}
          </h1>
        </header>

        <div className="p-4">{renderContent()}</div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Homepage;
