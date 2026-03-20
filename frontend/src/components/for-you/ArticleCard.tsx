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

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left group transition-all duration-200 rounded-xl overflow-hidden",
        "bg-white border border-[#E5E5E5] hover:border-[#D4D4D4] hover:shadow-md",
        "focus:outline-none focus:ring-2 focus:ring-[#B45309]/20",
        isSelected && "border-[#B45309] ring-2 ring-[#B45309]/20 shadow-md"
      )}
    >
      {/* Article Image */}
      {article.image_url && (
        <div className="relative aspect-[16/10] overflow-hidden bg-[#F5F5F4]">
          <Image
            src={article.image_url}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
            loading="lazy"
          />
        </div>
      )}

      <div className="p-4">
        {/* Category & Date */}
        <div className="flex items-center gap-2 mb-2">
          <span className="category-badge">
            {article.categories?.[0]?.name || 'General'}
          </span>
          <span className="text-xs text-[#9CA3AF]">
            {formatDate(article.published_at)}
          </span>
        </div>

        {/* Article Title */}
        <h3 className={cn(
          "font-semibold text-[#1A1A1A] line-clamp-2 leading-snug mb-2",
          "group-hover:text-[#B45309] transition-colors duration-200",
          isSelected && "text-[#B45309]"
        )}>
          {article.title}
        </h3>

        {/* Source */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#6B6B6B]">
            {article.source}
          </span>
        </div>
      </div>
    </button>
  );
};

export default ArticleCard;
