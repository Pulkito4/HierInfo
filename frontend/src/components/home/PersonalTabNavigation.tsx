import React from 'react';
import { Smile, TrendingUp } from 'lucide-react';

interface PersonalTabNavigationProps {
  activeSubTab: 'feed' | 'trending';
  onSubTabChange: (subTab: 'feed' | 'trending') => void;
}

const PersonalTabNavigation: React.FC<PersonalTabNavigationProps> = ({
  activeSubTab,
  onSubTabChange,
}) => {
  const getButtonClasses = (isActive: boolean) =>
    `flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
      isActive
        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
    }`;

  return (
    <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6">
      <button
        onClick={() => onSubTabChange('feed')}
        className={getButtonClasses(activeSubTab === 'feed')}
      >
        <div className="flex items-center justify-center gap-2">
          <Smile size={16} />
          For You
        </div>
      </button>
      
      <button
        onClick={() => onSubTabChange('trending')}
        className={getButtonClasses(activeSubTab === 'trending')}
      >
        <div className="flex items-center justify-center gap-2">
          <TrendingUp size={16} />
          Trending
        </div>
      </button>
    </div>
  );
};

export default PersonalTabNavigation;
