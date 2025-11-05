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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {articles.map((article) => (
        <DiscoverCard
          key={article.id}
          article={article}
          onClick={onArticleClick}
        />
      ))}
    </div>
  );
};

export default DiscoverGrid;
