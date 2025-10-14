import React from 'react';
import Link from 'next/link';
import { ThumbsUp, ThumbsDown, ExternalLink } from 'lucide-react';
import { Article } from '@/types';

interface ArticleActionsProps {
  article: Article;
  variant?: 'light' | 'dark' | 'overlay';
  size?: 'sm' | 'md' | 'lg';
  showSource?: boolean;
  showActions?: boolean;
  showReadMore?: boolean;
  onLike?: (articleId: string) => void;
  onDislike?: (articleId: string) => void;
  onReadMore?: (articleId: string) => void; // New prop for handling expansion
  isExpanded?: boolean; // New prop to track expansion state
  className?: string;
}

const ArticleActions: React.FC<ArticleActionsProps> = ({
  article,
  variant = 'light',
  size = 'md',
  showSource = true,
  showActions = true,
  showReadMore = true,
  onLike,
  onDislike,
  onReadMore,
  isExpanded = false,
  className = '',
}) => {
  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onLike?.(article.id);
  };

  const handleDislike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDislike?.(article.id);
  };

  // Size variants
  const sizeClasses = {
    sm: {
      text: 'text-xs',
      button: 'p-1',
      icon: 'w-3 h-3',
      gap: 'gap-1'
    },
    md: {
      text: 'text-sm',
      button: 'p-2',
      icon: 'w-4 h-4',
      gap: 'gap-2'
    },
    lg: {
      text: 'text-base',
      button: 'p-2',
      icon: 'w-5 h-5',
      gap: 'gap-3'
    }
  };

    // Color variants
  const variantClasses = {
    light: {
      source: 'text-gray-500 dark:text-gray-400',
      readMore: 'text-blue-600 dark:text-blue-400 hover:underline',
      button: 'text-gray-400 hover:text-gray-600',
      likeHover: 'hover:text-teal-300 ',
      dislikeHover: 'hover:text-red-500'
    },
    dark: {
      source: 'text-gray-300',
      readMore: 'text-blue-600 dark:text-blue-400 hover:underline',
      button: 'text-gray-300 hover:text-white',
      likeHover: 'hover:text-[#49E8C6]',
      dislikeHover: 'hover:text-red-400'
    },
    overlay: {
      source: 'text-white/80',
      readMore: 'text-teal-400 dark:text-blue-400 hover:underline',
      button: 'text-gray-300 hover:text-white',
      likeHover: 'hover:text-teal-400',
      dislikeHover: 'hover:text-red-400'
    }
  };

  const sizes = sizeClasses[size];
  const colors = variantClasses[variant];

  return (
    <div className={`flex justify-between items-center ${className}`}>
      {/* Left side - Source */}
      <div className="flex items-center space-x-2">
        {showSource && (
          <span className={`${sizes.text} font-semibold ${colors.source}`}>
            {variant === 'overlay' ? `Source: ${article.source}` :`Source: ${article.source}`}
          </span>
        )}
      </div>

      {/* Right side - Actions */}
      <div className={`flex items-center ${sizes.gap}`}>
        {/* Like/Dislike buttons */}
        {showActions && (
          <div className={`flex items-center ${sizes.gap}`}>
            <button
              onClick={handleLike}
              className={`${sizes.button} ${colors.button} ${colors.likeHover} transition-colors rounded`}
              title="Like this article"
            >
              <ThumbsUp className={sizes.icon} />
            </button>
            <button
              onClick={handleDislike}
              className={`${sizes.button} ${colors.button} ${colors.dislikeHover} transition-colors rounded`}
              title="Dislike this article"
            >
              <ThumbsDown className={sizes.icon} />
            </button>
          </div>
        )}

        {/* Read More button */}
        {showReadMore && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onReadMore) {
                onReadMore(article.id);
              }
            }}
            className={`${sizes.text} font-semibold ${colors.readMore} flex items-center ${sizes.gap} transition-all`}
            title={isExpanded ? "Show less" : "Read full article"}
          >
            {isExpanded ? "Show Less" : "Read More"}
          </button>
        )}
      </div>
    </div>
  );
};

export default ArticleActions;