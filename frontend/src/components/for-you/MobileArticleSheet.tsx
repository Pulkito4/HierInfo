"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Article } from '@/types/articles';
import { X, ThumbsUp, Share2, Bookmark, ExternalLink, Clock } from 'lucide-react';
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
        className="h-[92vh] p-0 bg-[#FFFBF5] border-t border-slate-200 rounded-t-3xl"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{article.title}</SheetTitle>
          <SheetDescription>Article details</SheetDescription>
        </SheetHeader>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-2.5 bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Scrollable Content */}
        <div ref={impressionRef} className="h-full overflow-y-auto">
          {/* Featured Image */}
          {article.image_url && (
            <div className="relative w-full h-56 bg-slate-100">
              <Image
                src={article.image_url}
                alt={article.title}
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#FFFBF5] via-transparent to-transparent" />
            </div>
          )}

          {/* Article Content */}
          <div className="p-5 -mt-8 relative z-10">
            {/* Category */}
            {article.categories && article.categories.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {article.categories.map((cat) => (
                  <span key={cat.id} className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-coral/10 text-coral border border-coral/20">
                    {cat.name}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="text-xl font-bold text-slate-800 mb-3 leading-tight">
              {article.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-2 mb-5 text-sm text-slate-500">
              <span className="font-semibold text-coral">{article.source}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <time dateTime={article.published_at}>
                  {formatDate(article.published_at)}
                </time>
              </div>
            </div>

            {/* Summary */}
            {article.summary && (
              <div className="mb-5">
                <p className="text-slate-600 leading-relaxed">
                  {article.summary}
                </p>
              </div>
            )}

            {/* Keywords */}
            {article.keywords && article.keywords.length > 0 && (
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-slate-500 mb-2">Related Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {article.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-5 border-t border-slate-200">
              <div className="flex items-center gap-2">
                {/* Like Button */}
                <button
                  onClick={handleLike}
                  disabled={isPending || localIsLiked || isCheckingLiked}
                  className={`
                    flex items-center justify-center w-11 h-11 rounded-xl font-medium transition-all
                    ${localIsLiked 
                      ? 'bg-coral/10 text-coral border border-coral/30' 
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
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
                    flex items-center justify-center w-11 h-11 rounded-xl font-medium transition-all
                    ${isBookmarked 
                      ? 'bg-gold/20 text-gold-dark border border-gold/30' 
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
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
                  className="flex items-center justify-center w-11 h-11 rounded-xl font-medium transition-all bg-slate-100 text-slate-500 border border-slate-200"
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
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all bg-gradient-to-r from-coral to-coral-light text-white text-sm"
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
