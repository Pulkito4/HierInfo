import React from 'react';
import type { Article } from '@/types/articles';
import ArticleCard from './ArticleCard';
import TrendingArticleCard from './TrendingArticleCard';

interface ArticleListProps {
  articles: Article[];
  selectedId?: string;
  onSelect: (article: Article) => void;
  loading?: boolean;
  showBadges?: boolean;
}

const ArticleList: React.FC<ArticleListProps> = ({ 
  articles, 
  selectedId, 
  onSelect,
  loading,
  showBadges = false
}) => {
  const CardComponent = showBadges ? TrendingArticleCard : ArticleCard;
  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-slate-800 h-32 rounded-md mb-3" />
            <div className="bg-slate-800 h-4 rounded w-3/4 mb-2" />
            <div className="bg-slate-800 h-3 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="text-6xl mb-4">📰</div>
        <h3 className="text-lg font-semibold text-slate-50 mb-2">
          No articles available
        </h3>
        <p className="text-sm text-slate-400">
          Check back later for new stories
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {articles.map((article) => (
        <CardComponent
          key={article.id}
          article={article}
          isSelected={article.id === selectedId}
          onClick={() => onSelect(article)}
        />
      ))}
    </div>
  );
};

export default ArticleList;
