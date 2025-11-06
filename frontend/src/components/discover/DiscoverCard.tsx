'use client';

import React from 'react';
import Image from 'next/image';
import { Clock, TrendingUp } from 'lucide-react';
import type { Article } from '@/types/articles';

interface DiscoverCardProps {
  article: Article;
  onClick: (article: Article) => void;
  featured?: boolean;
}

const DiscoverCard: React.FC<DiscoverCardProps> = ({ article, onClick, featured = false }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const getBadgeInfo = () => {
    // Show "Breaking" for critical articles
    if (article.is_critical) {
      return {
        text: 'Breaking',
        bgColor: 'bg-red-600/90',
  
      };
    }
    // Show "Trending" for articles with high trending score
    if (article.trending_score && article.trending_score > 10) {
      return {
        text: 'Trending',
        bgColor: 'bg-blue-600/90',
       
      };
    }
    // Default to null (no badge)
    return null;
  };

  return (
    <div
      onClick={() => onClick(article)}
      className={`
        group relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 
        rounded-2xl overflow-hidden cursor-pointer 
        border border-slate-700/50 hover:border-blue-500/50
        transition-all duration-300 
        hover:shadow-2xl hover:shadow-blue-900/20
        hover:-translate-y-1
        ${featured ? 'h-full' : 'h-full'}
      `}
    >
      {/* Image */}
      <div className={`relative w-full ${featured ? 'h-28 md:h-80' : 'h-40 md:h-48'} bg-slate-950 overflow-hidden`}>
        {article.image_url ? (
          <>
            <Image
              src={article.image_url}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-100"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {/* Gradient overlay */}
            {/* <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" /> */}
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-950 via-indigo-950 to-slate-950 flex items-center justify-center">
            <TrendingUp className="w-16 h-16 text-blue-500/30" />
          </div>
        )}
        
        {/* Trending/Breaking badge */}
        {featured && getBadgeInfo() && (
          <div className={`absolute top-4 left-4 px-3 py-1.5 ${getBadgeInfo()!.bgColor} backdrop-blur-sm rounded-full text-xs font-semibold text-white shadow-lg flex items-center gap-1.5`}>
            <span>{getBadgeInfo()!.text}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`${featured ? 'p-4 md:p-6' : 'p-3 md:p-5'}`}>
        {/* Category badge */}
        {article.categories && article.categories.length > 0 && (
          <span className="inline-block px-2.5 py-0.5 mb-2 text-xs font-medium bg-blue-950/50 text-blue-300 rounded-full border border-blue-800/30">
            {article.categories[0].name}
          </span>
        )}

        {/* Title */}
        <h3 className={`
          font-bold text-slate-50 mb-2 leading-tight 
          ${featured ? 'text-lg md:text-2xl' : 'text-sm md:text-base'}
           transition-colors
        `}>
          {article.title}
        </h3>

        {/* Summary for featured cards */}
        {featured && article.summary && (
          <p className="hidden md:block text-sm text-slate-400 mb-4 line-clamp-2 leading-relaxed">
            {article.summary}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-sm">
          <p className="text-blue-400 font-semibold">
            {article.source}
          </p>
          {/* <div className="flex items-center gap-1.5 text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs">{formatDate(article.published_at)}</span>
          </div> */}
        </div>
      </div>

      {/* Hover effect border glow */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
           style={{ 
             boxShadow: 'inset 0 0 20px rgba(59, 130, 246, 0.1)' 
           }} 
      />
    </div>
  );
};

export default DiscoverCard;
