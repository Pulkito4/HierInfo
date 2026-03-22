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
        "group w-full overflow-hidden rounded-2xl text-left transition-all duration-300",
        "border border-[#2a3444]/65 bg-[#141c27]/32",
        "hover:-translate-y-0.5 hover:border-cyan-300/45 hover:shadow-[0_16px_35px_-20px_rgba(0,0,0,0.95)]",
        "focus:outline-none focus:ring-2 focus:ring-cyan-300/35",
        isSelected && "border-cyan-300/70 ring-2 ring-cyan-300/30 shadow-[0_18px_40px_-22px_rgba(34,211,238,0.45)]"
      )}
    >
      {/* Article Image */}
      {article.image_url && (
        <div className="relative aspect-[16/10] overflow-hidden bg-[#223043]/65">
          <Image
            src={article.image_url}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
            loading="lazy"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          
          {/* Badges on image */}
          <div className="absolute top-3 left-3 flex gap-2">
            {isCritical && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#b54237] px-2 py-1 text-xs font-semibold text-white shadow-lg">
                <Zap className="w-3 h-3" />
                Breaking
              </span>
            )}
            {isTrending && !isCritical && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-cyan-300 px-2 py-1 text-xs font-semibold text-[#10202a] shadow-lg">
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
              <span key={cat.id} className="inline-flex items-center rounded-md border border-cyan-300/30 bg-cyan-300/10 px-2.5 py-0.5 text-xs font-medium text-cyan-200">
                {cat.name}
              </span>
            ))}
          </div>
        )}

        {/* Article Title */}
        <h3 className={cn(
          "mb-3 line-clamp-2 font-semibold leading-snug text-zinc-100",
          "transition-colors duration-200 group-hover:text-cyan-200",
          isSelected && "text-cyan-200"
        )}>
          {article.title}
        </h3>

        {/* Footer with Source and Date */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-cyan-200">
            {article.source}
          </span>
          <span className="text-xs text-zinc-400">
            {formatDate(article.published_at)}
          </span>
        </div>
      </div>
    </button>
  );
};

export default ArticleCard;
