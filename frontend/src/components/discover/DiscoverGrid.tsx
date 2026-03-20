'use client';

import React from 'react';
import DiscoverCard from './DiscoverCard';
import type { Article } from '@/types/articles';

interface DiscoverGridProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
}

const DiscoverGrid: React.FC<DiscoverGridProps> = ({ articles, onArticleClick }) => {
  if (articles.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 auto-rows-fr">
      {articles.map((article, index) => (
        <div 
          key={article.id}
          className={`
            ${index % 7 === 0 ? 'md:col-span-2 md:row-span-2' : ''}
            ${index % 11 === 0 && index !== 0 ? 'lg:col-span-2' : ''}
          `}
        >
          <DiscoverCard
            article={article}
            onClick={onArticleClick}
            featured={index % 7 === 0}
          />
        </div>
      ))}
    </div>
  );
};

export default DiscoverGrid;
