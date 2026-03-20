'use client';

import React from 'react';
import Image from 'next/image';
import { TrendingUp, Zap } from 'lucide-react';
import type { Article } from '@/types/articles';

interface DiscoverCardProps {
  article: Article;
  onClick: (article: Article) => void;
  featured?: boolean;
}

const DiscoverCard: React.FC<DiscoverCardProps> = ({ article, onClick, featured = false }) => {
  const getBadgeInfo = () => {
    if (article.is_critical) {
      return {
        text: 'Breaking',
        icon: Zap,
        bgColor: 'bg-[#DC2626]/90',
      };
    }
    if (article.trending_score && article.trending_score > 10) {
      return {
        text: 'Trending',
        icon: TrendingUp,
        bgColor: 'bg-[#1E40AF]/90',
      };
    }
    return null;
  };

  const badge = getBadgeInfo();

  return (
    <div
      onClick={() => onClick(article)}
      className={`
        group relative bg-white rounded-xl overflow-hidden cursor-pointer 
        border border-[#E5E5E5] hover:border-[#D4D4D4]
        transition-all duration-300 
        hover:shadow-lg
        hover:-translate-y-0.5
        ${featured ? 'h-full' : 'h-full'}
      `}
    >
      {/* Image */}
      <div className={`relative w-full ${featured ? 'h-48 md:h-72' : 'h-40'} bg-[#F5F5F4] overflow-hidden`}>
        {article.image_url ? (
          <>
            <Image
              src={article.image_url}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {/* Subtle overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </>
        ) : (
          <div className="w-full h-full bg-[#F5F5F4] flex items-center justify-center">
            <TrendingUp className="w-12 h-12 text-[#D4D4D4]" />
          </div>
        )}
        
        {/* Badge */}
        {featured && badge && (
          <div className={`absolute top-3 left-3 px-3 py-1.5 ${badge.bgColor} backdrop-blur-sm rounded-full text-xs font-semibold text-white shadow-sm flex items-center gap-1.5`}>
            <badge.icon className="w-3 h-3" />
            <span>{badge.text}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`${featured ? 'p-5' : 'p-4'}`}>
        {/* Category */}
        {(article.categories && article.categories.length > 0) && (
          <span className="inline-block px-2.5 py-0.5 mb-2 text-xs font-medium bg-[#F5F5F4] text-[#6B6B6B] rounded-md">
            {article.categories[0]?.name}
          </span>
        )}

        {/* Title */}
        <h3 className={`
          font-semibold text-[#1A1A1A] mb-2 leading-tight 
          ${featured ? 'text-lg' : 'text-sm'}
          group-hover:text-[#B45309] transition-colors
        `}>
          {article.title}
        </h3>

        {/* Summary for featured cards */}
        {featured && article.summary && (
          <p className="hidden md:block text-sm text-[#6B6B6B] mb-4 line-clamp-2 leading-relaxed">
            {article.summary}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-sm pt-2 border-t border-[#F5F5F4]">
          <p className="text-[#1A1A1A] font-medium text-xs">
            {article.source}
          </p>
          <span className="text-xs text-[#9CA3AF]">
            {new Date(article.published_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DiscoverCard;
