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
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Image placeholder */}
      <div className="w-full aspect-[16/10] bg-slate-200 animate-pulse" />
      
      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Badge */}
        <div className="h-5 bg-slate-200 rounded w-16 animate-pulse" />
        
        {/* Title */}
        <div className="space-y-2">
          <div className="h-5 bg-slate-200 rounded w-full animate-pulse" />
          <div className="h-5 bg-slate-200 rounded w-3/4 animate-pulse" />
        </div>
        
        {/* Source */}
        <div className="pt-2 flex justify-between">
          <div className="h-4 bg-slate-200 rounded w-24 animate-pulse" />
          <div className="h-4 bg-slate-200 rounded w-16 animate-pulse" />
        </div>
      </div>
    </div>
  );

  const FeaturedSkeleton = () => (
    <div className="w-full h-[400px] md:h-[500px] rounded-2xl bg-slate-200 animate-pulse relative overflow-hidden border border-slate-200">
      <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse" />
    </div>
  );

  const CategorySkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-24 bg-slate-100 rounded-xl border border-slate-200 animate-pulse" />
      ))}
    </div>
  );

  const ProfileSkeleton = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="h-16 w-16 bg-slate-200 rounded-full animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 rounded w-32 animate-pulse" />
          <div className="h-3 bg-slate-200 rounded w-24 animate-pulse" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
