import React from 'react';
import {
  SidebarContent,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { 
  Compass, 
  User, 
  Settings, 
  LogOut,
  Newspaper,
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
            : "flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:text-coral hover:bg-coral/5 w-full transition-all"
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
      <SidebarHeader className="border-b border-slate-200 p-4 bg-white">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-coral to-coral-light flex items-center justify-center flex-shrink-0 shadow-lg shadow-coral/30 group-hover:shadow-coral/50 transition-all">
              <Newspaper className="w-6 h-6 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <span className="text-xl font-bold text-slate-800 tracking-tight">
                  HierInfo
                </span>
                <span className="block text-xs text-slate-400 font-medium">
                  News, Simplified
                </span>
              </div>
            )}
          </Link>
        </div>
        
        {/* User Info */}
        {!isCollapsed && user && (
          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-coral to-coral-light flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {user.email?.split('@')[0] || 'Reader'}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="flex flex-col h-full py-4 px-3 bg-[#FFFBF5]">
        {/* Main Navigation */}
        <div className="space-y-1 flex-1">
          <div className="px-3 mb-2">
            {!isCollapsed && (
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
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
        <div className="pt-4 border-t border-slate-200 space-y-1">
          <div className="px-3 mb-2">
            {!isCollapsed && (
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
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
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-rose-50 w-full transition-all"
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
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="px-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
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
