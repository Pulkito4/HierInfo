import React from 'react';
import Image from 'next/image';
import type { Article } from '@/types/articles';
import { cn } from '@/lib/utils';
import { TrendingUp, Zap } from 'lucide-react';

interface ArticleCardProps {
  article: Article;
  isSelected?: boolean;
  onClick: () => void;
  showCategory?: boolean;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, isSelected, onClick, showCategory = false }) => {
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Determine trending status
  const isTrending = article.trending_score && article.trending_score > 10;
  const isCritical = article.is_critical;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left group transition-all duration-300 rounded-xl overflow-hidden",
        "bg-white",
        "border border-slate-200 hover:border-coral/50",
        "hover:shadow-lg hover:-translate-y-0.5",
        "focus:outline-none focus:ring-2 focus:ring-coral/30",
        isSelected && "border-coral ring-2 ring-coral/30 shadow-lg"
      )}
    >
      {/* Article Image */}
      {article.image_url && (
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
          <Image
            src={article.image_url}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
            loading="lazy"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          
          {/* Badges on image */}
          <div className="absolute top-3 left-3 flex gap-2">
            {isCritical && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-rose-500 text-white shadow-lg">
                <Zap className="w-3 h-3" />
                Breaking
              </span>
            )}
            {isTrending && !isCritical && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-gold text-slate-800 shadow-lg">
                <TrendingUp className="w-3 h-3" />
                Trending
              </span>
            )}
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Category - only show if explicitly requested */}
        {showCategory && article.categories && article.categories.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {article.categories.map((cat) => (
              <span key={cat.id} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-coral/10 text-coral border border-coral/20">
                {cat.name}
              </span>
            ))}
          </div>
        )}

        {/* Article Title */}
        <h3 className={cn(
          "font-semibold text-slate-800 line-clamp-2 leading-snug mb-3",
          "group-hover:text-coral transition-colors duration-200",
          isSelected && "text-coral"
        )}>
          {article.title}
        </h3>

        {/* Footer with Source and Date */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-coral">
            {article.source}
          </span>
          <span className="text-xs text-slate-400">
            {formatDate(article.published_at)}
          </span>
        </div>
      </div>
    </button>
  );
};

export default ArticleCard;
