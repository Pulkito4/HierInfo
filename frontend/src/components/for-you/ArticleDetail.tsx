'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import type { Article } from '@/types/articles';
import { ThumbsUp, ChevronLeft, ChevronRight, ExternalLink, Share2, Bookmark } from 'lucide-react';
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
  
  const { data: cachedIsLiked = false, isLoading: isCheckingLiked } = useArticleLikeStatus(article?.id);
  const [localIsLiked, setLocalIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  const { ref: impressionRef } = useArticleImpression(article?.id || '', {
    delay: 1000,
    threshold: 0.3,
  });

  useEffect(() => {
    if (!isCheckingLiked) {
      setLocalIsLiked(cachedIsLiked);
    }
  }, [cachedIsLiked, isCheckingLiked]);

  useEffect(() => {
    const parentContainer = containerRef.current?.parentElement;
    if (parentContainer) {
      parentContainer.scrollTop = 0;
    }
  }, [article?.id]);

  const handleLike = () => {
    if (!article || isPending || localIsLiked) return;
    
    setLocalIsLiked(true);
    setArticleLikeStatus(queryClient, article.id, true);
    trackActivity('like');
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const handleShare = async () => {
    if (!article) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.summary || '',
          url: article.url || window.location.href,
        });
      } catch {
        // User cancelled or share failed
      }
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-[#FAFAFA]">
        <div className="w-20 h-20 bg-[#F5F5F4] rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-[#9CA3AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">
          Select an article to read
        </h3>
        <p className="text-sm text-[#6B6B6B] max-w-md">
          Choose any article from the list on the left to view its full details
        </p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative min-h-full bg-white"
    >
      <article ref={impressionRef} className="max-w-4xl mx-auto p-6 lg:p-8 animate-in fade-in duration-300">
        {/* Article Header */}
        <header className="mb-8">
          {/* Category */}
          <div className="mb-4">
            <span className="category-badge bg-[#FEF3C7] text-[#B45309] border-[#FCD34D]">
              {article.categories?.[0]?.name || 'Article'}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1A1A1A] mb-4 leading-tight">
            {article.title}
          </h1>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#6B6B6B]">
            <span className="font-semibold text-[#1A1A1A]">{article.source}</span>
            <span className="w-1 h-1 rounded-full bg-[#D4D4D4]" />
            <time dateTime={article.published_at}>
              {formatDate(article.published_at)}
            </time>
          </div>
        </header>

        {/* Featured Image */}
        {article.image_url && (
          <figure className="mb-8 rounded-xl overflow-hidden bg-[#F5F5F4]">
            <div className="relative w-full aspect-[16/9]">
              <Image
                src={article.image_url}
                alt={article.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 960px"
              />
            </div>
          </figure>
        )}

        {/* Article Summary */}
        {article.summary && (
          <div className="mb-8">
            <div className="prose prose-lg max-w-none">
              <p className="text-[#2D2D2D] leading-relaxed text-lg">
                {article.summary}
              </p>
            </div>
          </div>
        )}

        {/* Keywords/Tags */}
        {article.keywords && article.keywords.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">Related Topics</h3>
            <div className="flex flex-wrap gap-2">
              {article.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#F5F5F4] text-[#6B6B6B] border border-[#E5E5E5] hover:border-[#D4D4D4] transition-colors"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-between py-6 border-t border-[#E5E5E5]">
          <div className="flex items-center gap-3">
            {/* Like Button */}
            <button
              onClick={handleLike}
              disabled={isPending || localIsLiked || isCheckingLiked}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all
                ${localIsLiked 
                  ? 'bg-[#FEF3C7] text-[#B45309]' 
                  : 'bg-[#F5F5F4] text-[#6B6B6B] hover:bg-[#EBEBEA] hover:text-[#1A1A1A]'
                }
                ${(isPending || isCheckingLiked) ? 'opacity-50 cursor-not-allowed' : ''}
                focus:outline-none focus:ring-2 focus:ring-[#B45309]/20
              `}
            >
              <ThumbsUp 
                size={18} 
                className={localIsLiked ? 'fill-current' : ''}
              />
              <span>{isCheckingLiked ? 'Loading...' : localIsLiked ? 'Liked' : 'Like'}</span>
            </button>

            {/* Bookmark Button */}
            <button
              onClick={handleBookmark}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all
                ${isBookmarked 
                  ? 'bg-[#DBEAFE] text-[#1E40AF]' 
                  : 'bg-[#F5F5F4] text-[#6B6B6B] hover:bg-[#EBEBEA] hover:text-[#1A1A1A]'
                }
                focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/20
              `}
            >
              <Bookmark 
                size={18} 
                className={isBookmarked ? 'fill-current' : ''}
              />
              <span className="hidden sm:inline">{isBookmarked ? 'Saved' : 'Save'}</span>
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all bg-[#F5F5F4] text-[#6B6B6B] hover:bg-[#EBEBEA] hover:text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/20"
            >
              <Share2 size={18} />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>

          {/* Read Original */}
          {article.url && (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all bg-[#1A1A1A] text-white hover:bg-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/20"
            >
              <span className="hidden sm:inline">Read Original</span>
              <ExternalLink size={18} />
            </a>
          )}
        </div>
      </article>

      {/* Navigation Controls */}
      {(hasNext || hasPrevious) && (
        <div className="max-w-4xl mx-auto px-6 lg:px-8 pb-8">
          <div className="flex gap-4 items-center justify-between pt-6 border-t border-[#E5E5E5]">
            {hasPrevious ? (
              <button
                onClick={onPrevious}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#F5F5F4] hover:bg-[#EBEBEA] text-[#1A1A1A] font-medium transition-all"
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
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#1A1A1A] hover:bg-[#2D2D2D] text-white font-medium transition-all"
              >
                <span>Next Article</span>
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleDetail;
