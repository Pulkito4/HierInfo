import React from 'react';
import Image from 'next/image';
import type { Article } from '@/types/articles';
import { cn } from '@/lib/utils';

interface ArticleCardProps {
  article: Article;
  isSelected?: boolean;
  onClick: () => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, isSelected, onClick }) => {
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
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="font-medium">{article.source}</span>
        {/* <span>
          {new Date(article.published_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          })}
        </span> */}
      </div>

    </button>
  );
};

export default ArticleCard;
