'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Article } from '@/types/articles';
import { ThumbsUp } from 'lucide-react';
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
  
  // Use React Query hook to check like status with caching
  const { data: cachedIsLiked = false, isLoading: isCheckingLiked } = useArticleLikeStatus(
    article?.id,
    open // Only fetch when drawer is open
  );
  
  // Local state for optimistic updates
  const [localIsLiked, setLocalIsLiked] = useState(false);
  
  // Track impression when drawer is open and content is viewed
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

  // Reset local state when drawer closes
  useEffect(() => {
    if (!open) {
      setLocalIsLiked(false);
    }
  }, [open]);

  const handleLike = () => {
    if (!article || isPending || localIsLiked) return;
    
    // Optimistic update
    setLocalIsLiked(true);
    setArticleLikeStatus(queryClient, article.id, true);
    
    // Track activity (will save to backend)
    trackActivity('like');
    
    console.log('Liked article:', article.title);
  };

  if (!article) return null;

  return (
    <>
      {/* Single Sheet instance to avoid double overlays. Side is responsive. */}
      <Sheet open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
        <SheetContent
          side={isMobile ? 'bottom' : 'right'}
          className={
            isMobile
              ? 'h-[90vh] p-0 bg-slate-900 border-t border-slate-800'
              : 'w-full sm:max-w-2xl p-0 bg-slate-900 border-l border-slate-800 overflow-y-auto flex-col'
          }
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{article.title}</SheetTitle>
            <SheetDescription>Article details</SheetDescription>
          </SheetHeader>

          {/* Scrollable Content */}
          <div ref={impressionRef} className={`h-full p-3 overflow-y-auto ${isMobile ? 'rounded-2xl' : ''}`}>
            {/* Featured Image */}
            {article.image_url && (
              <div className={`relative w-full ${isMobile ? 'h-56' : 'h-64'} bg-slate-800`}>
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
              {/* Title */}
              <h1 className={`font-bold text-slate-50 mb-4 leading-tight ${isMobile ? 'text-2xl' : 'text-2xl md:text-3xl'}`}>
                {article.title}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-3 mb-6 text-sm text-slate-400">
                <span className="font-semibold text-blue-400">{article.source}</span>
              </div>

              {/* Summary */}
              {article.summary && (
                <div className="mb-6">
                  <p className={`text-slate-300 leading-relaxed ${isMobile ? '' : 'text-base'}`}>
                    {article.summary}
                  </p>
                </div>
              )}

              {/* Keywords */}
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

              {/* Action Buttons */}
              <div className={`pt-4 border-t border-slate-800 ${isMobile ? 'flex flex-col gap-3' : 'flex gap-3'}`}>
                <button
                  onClick={(e) => { e.stopPropagation(); handleLike(); }}
                  disabled={isPending || isCheckingLiked || localIsLiked}
                  className={`flex items-center ${isMobile ? 'justify-center gap-2 px-4 py-3' : 'gap-2 px-4 py-2'} rounded-lg font-medium transition-all disabled:opacity-50 ${
                    localIsLiked
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <ThumbsUp size={18} className={localIsLiked ? 'fill-current' : ''} />
                  {localIsLiked ? 'Liked' : 'Like'}
                </button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default ArticleDrawer;
