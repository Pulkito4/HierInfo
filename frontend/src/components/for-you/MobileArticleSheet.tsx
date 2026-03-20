"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Article } from '@/types/articles';
import { X, ThumbsUp, Share2, Bookmark, ExternalLink } from 'lucide-react';
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
import { useQueryClient } from '@tanstack/react-query';

interface MobileArticleSheetProps {
  article: Article | null;
  open: boolean;
  onClose: () => void;
}

const MobileArticleSheet: React.FC<MobileArticleSheetProps> = ({ 
  article, 
  open, 
  onClose 
}) => {
  const queryClient = useQueryClient();
  const { trackActivity, isPending } = useArticleActivity(article?.id || '');
  
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
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-[92vh] p-0 bg-white border-t border-[#E5E5E5] rounded-t-2xl"
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
            <div className="relative w-full h-56 bg-[#F5F5F4]">
              <Image
                src={article.image_url}
                alt={article.title}
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
            </div>
          )}

          {/* Article Content */}
          <div className="p-5">
            {/* Category */}
            <div className="mb-3">
              <span className="category-badge bg-[#FEF3C7] text-[#B45309] border-[#FCD34D]">
                {article.categories?.[0]?.name || 'Article'}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-xl font-bold text-[#1A1A1A] mb-3 leading-tight">
              {article.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-2 mb-5 text-sm text-[#6B6B6B]">
              <span className="font-semibold text-[#1A1A1A]">{article.source}</span>
              <span className="w-1 h-1 rounded-full bg-[#D4D4D4]" />
              <time dateTime={article.published_at}>
                {formatDate(article.published_at)}
              </time>
            </div>

            {/* Summary */}
            {article.summary && (
              <div className="mb-5">
                <p className="text-[#2D2D2D] leading-relaxed">
                  {article.summary}
                </p>
              </div>
            )}

            {/* Keywords */}
            {article.keywords && article.keywords.length > 0 && (
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-[#1A1A1A] mb-2">Related Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {article.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#F5F5F4] text-[#6B6B6B] border border-[#E5E5E5]"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-5 border-t border-[#E5E5E5]">
              <div className="flex items-center gap-2">
                {/* Like Button */}
                <button
                  onClick={handleLike}
                  disabled={isPending || localIsLiked || isCheckingLiked}
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-lg font-medium transition-all
                    ${localIsLiked 
                      ? 'bg-[#FEF3C7] text-[#B45309]' 
                      : 'bg-[#F5F5F4] text-[#6B6B6B]'
                    }
                    ${(isPending || isCheckingLiked) ? 'opacity-50' : ''}
                  `}
                >
                  <ThumbsUp 
                    size={18} 
                    className={localIsLiked ? 'fill-current' : ''}
                  />
                </button>

                {/* Bookmark Button */}
                <button
                  onClick={handleBookmark}
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-lg font-medium transition-all
                    ${isBookmarked 
                      ? 'bg-[#DBEAFE] text-[#1E40AF]' 
                      : 'bg-[#F5F5F4] text-[#6B6B6B]'
                    }
                  `}
                >
                  <Bookmark 
                    size={18} 
                    className={isBookmarked ? 'fill-current' : ''}
                  />
                </button>

                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center w-10 h-10 rounded-lg font-medium transition-all bg-[#F5F5F4] text-[#6B6B6B]"
                >
                  <Share2 size={18} />
                </button>
              </div>

              {/* Read Original */}
              {article.url && (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all bg-[#1A1A1A] text-white text-sm"
                >
                  Read
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileArticleSheet;
