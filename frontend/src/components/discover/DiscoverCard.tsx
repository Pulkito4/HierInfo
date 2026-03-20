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
  const isCritical = article.is_critical;
  const isTrending = article.trending_score && article.trending_score > 10;

  return (
    <div
      onClick={() => onClick(article)}
      className={`
        group relative bg-white rounded-xl overflow-hidden cursor-pointer 
        border border-slate-200 hover:border-coral/50
        transition-all duration-300 
        hover:shadow-lg hover:-translate-y-1
        ${featured ? 'h-full' : 'h-full'}
      `}
    >
      {/* Image */}
      <div className={`relative w-full ${featured ? 'h-48 md:h-72' : 'h-40'} bg-slate-100 overflow-hidden`}>
        {article.image_url ? (
          <>
            <Image
              src={article.image_url}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#FFFBF5] via-transparent to-transparent" />
          </>
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center">
            <TrendingUp className="w-12 h-12 text-slate-300" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {featured && isCritical && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500 text-white shadow-lg">
              <Zap className="w-3 h-3" />
              Breaking
            </span>
          )}
          {featured && isTrending && !isCritical && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gold text-slate-800 shadow-lg">
              <TrendingUp className="w-3 h-3" />
              Trending
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`${featured ? 'p-5' : 'p-4'}`}>
        {/* Category */}
        {article.categories && article.categories.length > 0 && (
          <span className="inline-block px-2.5 py-0.5 mb-2 text-xs font-semibold bg-coral/10 text-coral rounded-md border border-coral/20">
            {article.categories[0].name}
          </span>
        )}

        {/* Title */}
        <h3 className={`
          font-bold text-slate-800 mb-2 leading-tight 
          ${featured ? 'text-lg' : 'text-sm'}
          group-hover:text-coral transition-colors
        `}>
          {article.title}
        </h3>

        {/* Summary for featured cards */}
        {featured && article.summary && (
          <p className="hidden md:block text-sm text-slate-500 mb-4 line-clamp-2 leading-relaxed">
            {article.summary}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-100">
          <span className="text-coral font-medium text-xs">
            {article.source}
          </span>
          <span className="text-xs text-slate-400">
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
