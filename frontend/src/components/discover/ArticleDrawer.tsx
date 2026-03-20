'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Article } from '@/types/articles';
import { ThumbsUp, X, ExternalLink, Share2, Bookmark } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { useArticleActivity } from '@/hooks/useArticleActivity';
import { useArticleImpression } from '@/hooks/useArticleImpression';
import { useArticleLikeStatus, setArticleLikeStatus } from '@/hooks/useArticleLikeStatus';
import { useIsMobile } from '@/hooks/use-mobile';
import { useQueryClient } from '@tanstack/react-query';

interface ArticleDrawerProps {
  article: Article | null;
  open: boolean;
  onClose: () => void;
}

const ArticleDrawer: React.FC<ArticleDrawerProps> = ({ 
  article, 
  open, 
  onClose 
}) => {
  const queryClient = useQueryClient();
  const { trackActivity, isPending } = useArticleActivity(article?.id || '');
  const isMobile = useIsMobile();
  
  const { data: cachedIsLiked = false, isLoading: isCheckingLiked } = useArticleLikeStatus(
    article?.id,
    open
  );
  
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
    if (!open) {
      setLocalIsLiked(false);
      setIsBookmarked(false);
    }
  }, [open]);

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
        // User cancelled
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!article) return null;

  return (
    <Sheet open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={
          isMobile
            ? 'h-[92vh] p-0 bg-white border-t border-[#E5E5E5] rounded-t-2xl'
            : 'w-full sm:max-w-2xl p-0 bg-white border-l border-[#E5E5E5] overflow-y-auto'
        }
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{article.title}</SheetTitle>
          <SheetDescription>Article details</SheetDescription>
        </SheetHeader>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-2 bg-white/90 backdrop-blur-sm shadow-sm border border-[#E5E5E5] text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
        >
          <X size={20} />
        </button>

        {/* Scrollable Content */}
        <div ref={impressionRef} className="h-full overflow-y-auto">
          {/* Featured Image */}
          {article.image_url && (
            <div className={`relative w-full ${isMobile ? 'h-56' : 'h-72'} bg-[#F5F5F4]`}>
              <Image
                src={article.image_url}
                alt={article.title}
                fill
                className="object-cover"
                priority={!isMobile}
                sizes={isMobile ? '100vw' : '(max-width: 768px) 100vw, 50vw'}
              />
            </div>
          )}

          {/* Article Content */}
          <div className="p-6">
            {/* Category */}
            <div className="mb-3">
              <span className="category-badge bg-[#FEF3C7] text-[#B45309] border-[#FCD34D]">
                {article.categories?.[0]?.name || 'Article'}
              </span>
            </div>

            {/* Title */}
            <h1 className={`font-bold text-[#1A1A1A] mb-4 leading-tight ${isMobile ? 'text-xl' : 'text-2xl md:text-3xl'}`}>
              {article.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 mb-6 text-sm text-[#6B6B6B]">
              <span className="font-semibold text-[#1A1A1A]">{article.source}</span>
              <span className="w-1 h-1 rounded-full bg-[#D4D4D4]" />
              <time dateTime={article.published_at}>
                {formatDate(article.published_at)}
              </time>
            </div>

            {/* Summary */}
            {article.summary && (
              <div className="mb-6">
                <p className="text-[#2D2D2D] leading-relaxed text-base">
                  {article.summary}
                </p>
              </div>
            )}

            {/* Keywords */}
            {article.keywords && article.keywords.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">Related Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {article.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#F5F5F4] text-[#6B6B6B] border border-[#E5E5E5]"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className={`pt-6 border-t border-[#E5E5E5] ${isMobile ? 'flex flex-wrap gap-2' : 'flex gap-3'}`}>
              <button
                onClick={(e) => { e.stopPropagation(); handleLike(); }}
                disabled={isPending || isCheckingLiked || localIsLiked}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 ${
                  localIsLiked
                    ? 'bg-[#FEF3C7] text-[#B45309]'
                    : 'bg-[#F5F5F4] text-[#6B6B6B] hover:bg-[#EBEBEA] hover:text-[#1A1A1A]'
                }`}
              >
                <ThumbsUp size={18} className={localIsLiked ? 'fill-current' : ''} />
                <span>{localIsLiked ? 'Liked' : 'Like'}</span>
              </button>

              <button
                onClick={handleBookmark}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  isBookmarked
                    ? 'bg-[#DBEAFE] text-[#1E40AF]'
                    : 'bg-[#F5F5F4] text-[#6B6B6B] hover:bg-[#EBEBEA] hover:text-[#1A1A1A]'
                }`}
              >
                <Bookmark size={18} className={isBookmarked ? 'fill-current' : ''} />
                <span className="hidden sm:inline">{isBookmarked ? 'Saved' : 'Save'}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all bg-[#F5F5F4] text-[#6B6B6B] hover:bg-[#EBEBEA] hover:text-[#1A1A1A]"
              >
                <Share2 size={18} />
                <span className="hidden sm:inline">Share</span>
              </button>

              {article.url && (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all bg-[#1A1A1A] text-white hover:bg-[#2D2D2D] ml-auto"
                >
                  <span className="hidden sm:inline">Read Original</span>
                  <ExternalLink size={18} />
                </a>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ArticleDrawer;
