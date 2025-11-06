import React from 'react';
import {
  SidebarContent,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { Earth, Settings, Smile } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import Image from 'next/image';

interface HomeSidebarProps {
  activeTab: 'personal' | 'explore' | 'settings';
  onTabChange: (tab: 'personal' | 'explore' | 'settings') => void;
}

const HomeSidebar: React.FC<HomeSidebarProps> = ({ activeTab, onTabChange }) => {
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === 'collapsed' && !isMobile;

  const getButtonClasses = (isActive: boolean) =>
    `w-full flex items-center gap-3 p-3.5 rounded-xl transition-all duration-300 ${
      isActive
        ? 'bg-gradient-to-r from-blue-900/90 to-indigo-900/90 text-white shadow-lg shadow-blue-900/40 scale-[1.02] border border-blue-700/30'
        : 'text-gray-300 hover:bg-slate-800/60 hover:text-white hover:scale-[1.01] border border-transparent'
    }`;

  const NavButton = ({
    icon: Icon,
    label,
    isActive,
    onClick,
    iconColor,
  }: {
    icon: React.ElementType;
    label: string;
    isActive: boolean;
    onClick: () => void;
    iconColor: string;
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <button onClick={onClick} className={getButtonClasses(isActive)}>
          <Icon className={iconColor + ' flex-shrink-0'} size={20} />
          {!isCollapsed && <span className="font-sans font-semibold">{label}</span>}
        </button>
      </TooltipTrigger>
      {isCollapsed && <TooltipContent side="right">{label}</TooltipContent>}
    </Tooltip>
  );

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
      <hr className="border-gray-200" />
      <SidebarContent className="flex flex-col justify-between h-full">
        <div className="p-2 space-y-2">
          <NavButton
            icon={Smile}
            label="For You"
            isActive={activeTab === 'personal'}
            onClick={() => onTabChange('personal')}
            iconColor="text-[#5B87F8]"
          />
          <NavButton
            icon={Earth}
            label="Discover"
            isActive={activeTab === 'explore'}
            onClick={() => onTabChange('explore')}
            iconColor="text-[#49E8C6]"
          />
        </div>

        <div className="p-2 border-t border-white/20">
          <NavButton
            icon={Settings}
            label="Settings"
            isActive={activeTab === 'settings'}
            onClick={() => onTabChange('settings')}
            iconColor="text-[#E0E7FF]"
          />
        </div>
      </SidebarContent>
    </>
  );
};

export default HomeSidebar;
