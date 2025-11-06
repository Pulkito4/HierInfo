'use client';

import React from 'react';
import Image from 'next/image';
import type { Article } from '@/types/articles';

interface DiscoverCardProps {
  article: Article;
  onClick: (article: Article) => void;
}

const DiscoverCard: React.FC<DiscoverCardProps> = ({ article, onClick }) => {
  return (
    <div
      onClick={() => onClick(article)}
      className="bg-slate-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500/50 transition-all"
    >
      {/* Image */}
      <div className="relative w-full h-48 bg-slate-900">
        {article.image_url ? (
          <Image
            src={article.image_url}
            alt={article.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-900 via-slate-800 to-slate-900" />
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-base font-semibold text-slate-50 mb-2 leading-tight line-clamp-2">
          {article.title}
        </h3>

        {/* Source */}
        <p className="text-sm text-blue-400 font-medium">
          {article.source}
        </p>
      </div>
    </div>
  );
};

export default DiscoverCard;
