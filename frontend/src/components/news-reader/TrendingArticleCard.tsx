import React from 'react';
import Image from 'next/image';
import type { Article } from '@/types/articles';
import { cn } from '@/lib/utils';

interface TrendingArticleCardProps {
  article: Article;
  isSelected?: boolean;
  onClick: () => void;
}

const TrendingArticleCard: React.FC<TrendingArticleCardProps> = ({ article, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-lg transition-all duration-200",
        "hover:bg-slate-800/50 border border-slate-700/50",
        "focus:outline-none focus:ring-2 focus:ring-blue-500",
        isSelected && "bg-slate-800 border-blue-500/50"
      )}
    >
      {/* Article Image */}
      {article.image_url && (
        <div className="relative w-full h-32 mb-3 rounded-md overflow-hidden bg-slate-800">
          <Image
            src={article.image_url}
            alt={article.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 300px"
          />
        </div>
      )}

      {/* Article Title */}
      <h3 className={cn(
        "font-semibold text-sm line-clamp-2 mb-2",
        isSelected ? "text-blue-400" : "text-slate-50"
      )}>
        {article.title}
      </h3>

      {/* Source and Date */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
        <span className="font-medium">{article.source}</span>
        <span>
          {new Date(article.published_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          })}
        </span>
      </div>

      {/* Badges Row */}
      <div className="flex items-center gap-2">
        {/* Critical Indicator */}
        {article.is_critical && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>Breaking</span>
          </div>
        )}

        {/* Trending Indicator with Score */}
        {article.trending_score && article.trending_score > 1 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
            </svg>
            <span>Trending</span>
          </div>
        )}
      </div>
    </button>
  );
};

export default TrendingArticleCard;
