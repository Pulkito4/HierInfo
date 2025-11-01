import React from 'react';

interface LoadingSkeletonProps {
  type: 'articles' | 'featured' | 'categories' | 'profile';
  count?: number;
  className?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  type, 
  count = 1, 
  className = '' 
}) => {
  const ArticleSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden animate-pulse">
      {/* Image placeholder */}
      <div className="w-full h-48 bg-gray-300 dark:bg-gray-700" />
      
      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Source */}
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-20" />
        
        {/* Title */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
        </div>
        
        {/* Summary */}
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full" />
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-5/6" />
        </div>
        
        {/* Actions */}
        <div className="flex justify-between items-center pt-2">
          <div className="flex space-x-2">
            <div className="h-6 w-6 bg-gray-300 dark:bg-gray-700 rounded" />
            <div className="h-6 w-6 bg-gray-300 dark:bg-gray-700 rounded" />
          </div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16" />
        </div>
      </div>
    </div>
  );

  const FeaturedSkeleton = () => (
    <div className="w-full h-96 rounded-lg bg-gray-300 dark:bg-gray-700 animate-pulse relative overflow-hidden">
      <div className="absolute bottom-8 left-8 right-8 space-y-4">
        <div className="h-8 bg-gray-800/50 rounded w-3/4" />
        <div className="h-4 bg-gray-800/30 rounded w-1/2" />
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gray-800/40 rounded w-24" />
          <div className="flex space-x-2">
            <div className="h-6 w-6 bg-gray-800/40 rounded" />
            <div className="h-6 w-6 bg-gray-800/40 rounded" />
          </div>
        </div>
      </div>
    </div>
  );

  const CategorySkeleton = () => (
    <div className="flex space-x-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-8 bg-gray-300 dark:bg-gray-700 rounded-full w-20 animate-pulse" />
      ))}
    </div>
  );

  const ProfileSkeleton = () => (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center space-x-4">
        <div className="h-16 w-16 bg-gray-300 dark:bg-gray-700 rounded-full" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-32" />
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-24" />
        </div>
      </div>
    </div>
  );

  const renderSkeleton = () => {
    switch (type) {
      case 'featured':
        return <FeaturedSkeleton />;
      case 'categories':
        return <CategorySkeleton />;
      case 'profile':
        return <ProfileSkeleton />;
      case 'articles':
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, i) => (
              <ArticleSkeleton key={i} />
            ))}
          </div>
        );
    }
  };

  return <div className={className}>{renderSkeleton()}</div>;
};

export default LoadingSkeleton;