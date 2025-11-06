"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Article } from '@/types/articles';
import { X, ExternalLink, Calendar, ThumbsUp } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { useArticleActivity } from '@/hooks/useArticleActivity';
import { useArticleImpression } from '@/hooks/useArticleImpression';
import { checkArticleLiked } from '@/lib/react-query/queries';

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
  const [isLiked, setIsLiked] = useState(false);
  const [isCheckingLiked, setIsCheckingLiked] = useState(false);
  const { trackActivity, isPending } = useArticleActivity(article?.id || '');
  
  // Track impression when sheet is open and content is viewed
  const { ref: impressionRef } = useArticleImpression(article?.id || '', {
    delay: 1000,
    threshold: 0.3,
  });

  // Check if article is already liked when article changes
  useEffect(() => {
    if (!article?.id || !open) {
      setIsLiked(false);
      return;
    }

    setIsCheckingLiked(true);
    checkArticleLiked(article.id)
      .then((liked) => {
        setIsLiked(liked);
      })
      .catch((error) => {
        console.error('Error checking liked status:', error);
        setIsLiked(false);
      })
      .finally(() => {
        setIsCheckingLiked(false);
      });
  }, [article?.id, open]);

  const handleLike = () => {
    if (!article || isPending) return;
    
    trackActivity('like');
    setIsLiked(true);
    console.log('Liked article:', article.title);
  };

  if (!article) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-[90vh] p-0 bg-slate-900 border-t border-slate-800"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{article.title}</SheetTitle>
          <SheetDescription>Article details</SheetDescription>
        </SheetHeader>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-2 bg-slate-800/80 backdrop-blur-sm text-slate-400 hover:text-slate-50 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Scrollable Content */}
        <div ref={impressionRef} className="h-full overflow-y-auto">
          {/* Featured Image */}
          {article.image_url && (
            <div className="relative w-full h-56 bg-slate-800">
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
          <div className="p-6">
            {/* Title */}
            <h1 className="text-2xl font-bold text-slate-50 mb-4 leading-tight">
              {article.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 mb-6 text-sm text-slate-400">
              <span className="font-semibold text-blue-400">{article.source}</span>
              <div className="flex items-center gap-1">
                {/* <Calendar size={14} />
                <time dateTime={article.published_at}>
                  {new Date(article.published_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </time> */}
              </div>
            </div>

            {/* Summary */}
            {article.summary && (
              <div className="mb-6">
                <p className="text-slate-300 leading-relaxed">
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

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-6 pb-8 border-t border-slate-700">
              {/* Like Button */}
              <button
                onClick={handleLike}
                disabled={isPending || isLiked || isCheckingLiked}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                  ${isLiked 
                    ? 'bg-teal-500/20 text-teal-400 cursor-default' 
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-teal-400'
                  }
                  ${(isPending || isCheckingLiked) ? 'opacity-50 cursor-not-allowed' : ''}
                  focus:outline-none focus:ring-2 focus:ring-teal-500/50
                `}
                title={isLiked ? 'Liked' : 'Like this article'}
              >
                <ThumbsUp 
                  size={18} 
                  className={isLiked ? 'fill-current' : ''}
                />
                <span>{isCheckingLiked ? 'Loading...' : isLiked ? 'Liked' : 'Like'}</span>
              </button>

            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileArticleSheet;
