'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import type { Article } from '@/types/articles';
import { ThumbsUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { useArticleActivity } from '@/hooks/useArticleActivity';
import { useArticleImpression } from '@/hooks/useArticleImpression';
import { useArticleLikeStatus } from '@/hooks/useArticleLikeStatus';
import { useQueryClient } from '@tanstack/react-query';
import { setArticleLikeStatus } from '@/hooks/useArticleLikeStatus';

interface ArticleDetailProps {
  article: Article | null;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

const ArticleDetail: React.FC<ArticleDetailProps> = ({ 
  article, 
  onNext, 
  onPrevious, 
  hasNext = false, 
  hasPrevious = false 
}) => {
  const queryClient = useQueryClient();
  const { trackActivity, isPending } = useArticleActivity(article?.id || '');
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use React Query hook to check like status with caching
  const { data: cachedIsLiked = false, isLoading: isCheckingLiked } = useArticleLikeStatus(article?.id);
  
  // Local state for optimistic updates
  const [localIsLiked, setLocalIsLiked] = useState(false);
  
  // Track impression when article is viewed
  const { ref: impressionRef } = useArticleImpression(article?.id || '', {
    delay: 1000,
    threshold: 0.3,
  });

  // Sync local state with cached data when it changes
  useEffect(() => {
    if (!isCheckingLiked) {
      setLocalIsLiked(cachedIsLiked);
    }
  }, [cachedIsLiked, isCheckingLiked]);

  // Reset scroll position when article changes
  useEffect(() => {
    // Scroll the parent container (NewsReaderLayout's right panel)
    const parentContainer = containerRef.current?.parentElement;
    if (parentContainer) {
      parentContainer.scrollTop = 0;
    }
  }, [article?.id]);

  const handleLike = () => {
    if (!article || isPending || localIsLiked) return;
    
    // Optimistic update
    setLocalIsLiked(true);
    setArticleLikeStatus(queryClient, article.id, true);
    
    // Track activity (will save to backend)
    trackActivity('like');
    
    // Optional: Show a toast notification
    console.log('Liked article:', article.title);
  };
  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        {/* <div className="text-6xl mb-4">👈</div> */}
        <h3 className="text-xl font-semibold text-slate-50 mb-2">
          Select an article to read
        </h3>
        <p className="text-sm text-slate-400 max-w-md">
          Choose any article from the list on the left to view its full details
        </p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative min-h-full"
    >
      <article ref={impressionRef} className="max-w-4xl mx-auto p-6 animate-in fade-in duration-300">
      {/* Article Header */}
      <div className="mb-6">
        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-slate-50 mb-4 leading-tight">
          {article.title}
        </h1>

        {/* Meta Information */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
          <span className="font-semibold text-blue-400">{article.source}</span>
          <div className="flex items-center gap-1">
            {/* <Calendar size={16} /> */}
            {/* <time dateTime={article.published_at}>
              {new Date(article.published_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </time> */}
          </div>
        </div>
      </div>

      {/* Featured Image */}
      {article.image_url && (
        <div className="relative w-full h-64 md:h-96 mb-6 rounded-xl overflow-hidden bg-slate-800">
          <Image
            src={article.image_url}
            alt={article.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          />
        </div>
      )}

      {/* Article Summary */}
      {article.summary && (
        <div className="mb-6">
          <div className="prose prose-invert prose-lg max-w-none">
            <p className="text-slate-300 leading-relaxed text-lg">
              {article.summary}
            </p>
          </div>
        </div>
      )}

      {/* Keywords/Tags */}
      {article.keywords && article.keywords.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-400 mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {article.keywords.map((keyword, index) => (
              <span
                key={index}
                className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-700">
        {/* Like Button */}
        <button
          onClick={handleLike}
          disabled={isPending || localIsLiked || isCheckingLiked}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
            ${localIsLiked 
              ? 'bg-teal-500/20 text-teal-400 cursor-default' 
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-teal-400'
            }
            ${(isPending || isCheckingLiked) ? 'opacity-50 cursor-not-allowed' : ''}
            focus:outline-none focus:ring-2 focus:ring-teal-500/50
          `}
          title={localIsLiked ? 'Liked' : 'Like this article'}
        >
          <ThumbsUp 
            size={18} 
            className={localIsLiked ? 'fill-current' : ''}
          />
          <span>{isCheckingLiked ? 'Loading...' : localIsLiked ? 'Liked' : 'Like'}</span>
        </button>

      </div>
    </article>

      {/* Navigation Controls */}
      <div className="max-w-4xl mx-auto px-6 pb-8">
        {/* Navigation Buttons */}
        <div className="flex gap-4 items-center justify-between pt-6 border-t border-slate-800">
          {hasPrevious ? (
            <button
              onClick={onPrevious}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
            >
              <ChevronLeft size={20} />
              <span>Previous</span>
            </button>
          ) : (
            <div></div>
          )}
          
          {hasNext && (
            <button
              onClick={onNext}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all"
            >
              <span>Next Article</span>
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticleDetail;
