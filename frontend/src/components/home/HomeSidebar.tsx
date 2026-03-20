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
  Newspaper
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
          className={isActive ? "nav-item-active" : "nav-item"}
        >
          <Icon className="flex-shrink-0" size={20} />
          {!isCollapsed && <span className="font-medium">{label}</span>}
        </button>
      </TooltipTrigger>
      {isCollapsed && <TooltipContent side="right">{label}</TooltipContent>}
    </Tooltip>
  );

  return (
    <>
      <SidebarHeader className="border-b border-[#E5E5E5]">
        <div className="flex items-center py-4 px-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1A1A1A] rounded-md flex items-center justify-center flex-shrink-0">
              <Newspaper className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <span className="text-xl font-bold text-[#1A1A1A] tracking-tight">
                HierInfo
              </span>
            )}
          </Link>
        </div>
        
        {/* User Info */}
        {!isCollapsed && user && (
          <div className="px-3 pb-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F5F5F4]">
              <div className="w-8 h-8 bg-[#1A1A1A] rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1A1A1A] truncate">
                  {user.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-[#6B6B6B] truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="flex flex-col h-full py-4">
        {/* Main Navigation */}
        <div className="px-3 space-y-1 flex-1">
          <NavButton
            icon={User}
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
        <div className="px-3 pt-4 border-t border-[#E5E5E5] space-y-1">
          <NavButton
            icon={Settings}
            label="Settings"
            isActive={activeTab === 'settings'}
            onClick={() => onTabChange('settings')}
          />
          
          {/* Sign Out */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={signOut}
                className="nav-item text-[#DC2626] hover:text-[#B91C1C] hover:bg-[#FEF2F2]"
              >
                <LogOut className="flex-shrink-0" size={20} />
                {!isCollapsed && <span className="font-medium">Sign Out</span>}
              </button>
            </TooltipTrigger>
            {isCollapsed && <TooltipContent side="right">Sign Out</TooltipContent>}
          </Tooltip>
        </div>
      </SidebarContent>
    </>
  );
};

export default HomeSidebar;
