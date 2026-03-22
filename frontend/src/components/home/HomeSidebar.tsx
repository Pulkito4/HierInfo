import React from 'react';
import {
  SidebarContent,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import Image from 'next/image';
import { 
  Compass, 
  User, 
  Settings, 
  LogOut,
  Heart
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';

interface HomeSidebarProps {
  activeTab: 'personal' | 'explore' | 'settings';
  onTabChange: (tab: 'personal' | 'explore' | 'settings') => void;
}

const HomeSidebar: React.FC<HomeSidebarProps> = ({ activeTab, onTabChange }) => {
  const { state, isMobile } = useSidebar();
  const { user, signOut } = useAuth();
  const isCollapsed = state === 'collapsed' && !isMobile;

  const NavButton = ({
    icon: Icon,
    label,
    isActive,
    onClick,
  }: {
    icon: React.ElementType;
    label: string;
    isActive: boolean;
    onClick: () => void;
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <button 
          onClick={onClick} 
          className={isActive 
            ? "flex items-center gap-3 px-4 py-3 rounded-xl font-medium bg-gradient-to-r from-coral to-coral-light text-white shadow-md w-full transition-all" 
            : "flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:text-coral hover:bg-coral/10 w-full transition-all"
          }
        >
          <Icon className="flex-shrink-0" size={20} />
          {!isCollapsed && (
            <span className="font-medium flex-1 text-left">{label}</span>
          )}
        </button>
      </TooltipTrigger>
      {isCollapsed && <TooltipContent side="right">{label}</TooltipContent>}
    </Tooltip>
  );

  return (
    <>
      <SidebarHeader className="border-b border-slate-800/70 p-4 bg-slate-950/70">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <Image src="/logoicon.png" alt="HierInfo logo" width={40} height={40} className="w-10 h-10 object-contain flex-shrink-0" />
            {!isCollapsed && (
              <div>
                <span className="text-xl font-bold text-slate-100 tracking-tight">
                  HierInfo
                </span>
                <span className="block text-xs text-slate-500 font-medium">
                  News, Simplified
                </span>
              </div>
            )}
          </Link>
        </div>
        
        {/* User Info */}
        {!isCollapsed && user && (
          <div className="mt-6 p-4 rounded-xl bg-slate-900/80 border border-slate-700/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-coral to-coral-light flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-100 truncate">
                  {user.email?.split('@')[0] || 'Reader'}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="flex flex-col h-full py-4 px-3 bg-slate-950/60">
        {/* Main Navigation */}
        <div className="space-y-1 flex-1">
          <div className="px-3 mb-2">
            {!isCollapsed && (
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Your Feeds
              </span>
            )}
          </div>
          
          <NavButton
            icon={Heart}
            label="For You"
            isActive={activeTab === 'personal'}
            onClick={() => onTabChange('personal')}
          />
          <NavButton
            icon={Compass}
            label="Discover"
            isActive={activeTab === 'explore'}
            onClick={() => onTabChange('explore')}
          />
        </div>

        {/* Bottom Section */}
        <div className="pt-4 border-t border-slate-800/70 space-y-1">
          <div className="px-3 mb-2">
            {!isCollapsed && (
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Settings
              </span>
            )}
          </div>
          
          <NavButton
            icon={Settings}
            label="Preferences"
            isActive={activeTab === 'settings'}
            onClick={() => onTabChange('settings')}
          />
          
          {/* Sign Out */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={signOut}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 w-full transition-all"
              >
                <LogOut className="flex-shrink-0" size={20} />
                {!isCollapsed && <span className="font-medium">Sign Out</span>}
              </button>
            </TooltipTrigger>
            {isCollapsed && <TooltipContent side="right">Sign Out</TooltipContent>}
          </Tooltip>
        </div>

        {/* Footer Info - Consumer friendly */}
        {!isCollapsed && (
          <div className="mt-4 pt-4 border-t border-slate-800/70">
            <div className="px-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-2 h-2 rounded-full bg-teal" />
                <span>Smart filtering active</span>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </>
  );
};

export default HomeSidebar;
