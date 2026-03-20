import React from 'react';
import { User, TrendingUp } from 'lucide-react';

interface PersonalTabNavigationProps {
  activeSubTab: 'feed' | 'trending';
  onSubTabChange: (subTab: 'feed' | 'trending') => void;
}

const PersonalTabNavigation: React.FC<PersonalTabNavigationProps> = ({
  activeSubTab,
  onSubTabChange,
}) => {
  return (
    <div className="flex items-center gap-1 bg-[#F5F5F4] rounded-xl p-1.5 mb-6 sticky top-0 z-10">
      <button
        onClick={() => onSubTabChange('feed')}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
          activeSubTab === 'feed'
            ? 'bg-white text-[#1A1A1A] shadow-sm'
            : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
        }`}
      >
        <User size={16} />
        <span className="hidden sm:inline">For You</span>
        <span className="sm:hidden">For You</span>
      </button>
      
      <button
        onClick={() => onSubTabChange('trending')}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
          activeSubTab === 'trending'
            ? 'bg-white text-[#1A1A1A] shadow-sm'
            : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
        }`}
      >
        <TrendingUp size={16} />
        <span className="hidden sm:inline">Trending</span>
        <span className="sm:hidden">Trending</span>
      </button>
    </div>
  );
};

export default PersonalTabNavigation;
