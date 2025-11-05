'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Article } from '@/types/articles';
import { X, ExternalLink, ThumbsUp } from 'lucide-react';
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
  const [isLiked, setIsLiked] = useState(false);
  const [isCheckingLiked, setIsCheckingLiked] = useState(false);
  const { trackActivity, isPending } = useArticleActivity(article?.id || '');
  
  // Track impression when drawer is open and content is viewed
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
    <>
      {/* Desktop: Right Drawer */}
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent 
          side="right" 
          className="hidden md:flex w-full sm:max-w-2xl p-0 bg-slate-900 border-l border-slate-800 overflow-y-auto flex-col"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{article.title}</SheetTitle>
            <SheetDescription>Article details</SheetDescription>
          </SheetHeader>

          {/* Scrollable Content */}
          <div ref={impressionRef} className="h-full overflow-y-auto">
            {/* Featured Image */}
            {article.image_url && (
              <div className="relative w-full h-64 bg-slate-800">
                <Image
                  src={article.image_url}
                  alt={article.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            )}

            {/* Article Content */}
            <div className="p-6">
              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-bold text-slate-50 mb-4 leading-tight">
                {article.title}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-3 mb-6 text-sm text-slate-400">
                <span className="font-semibold text-blue-400">{article.source}</span>
              </div>

              {/* Summary */}
              {article.summary && (
                <div className="mb-6">
                  <p className="text-slate-300 leading-relaxed text-base">
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
              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={handleLike}
                  disabled={isPending || isCheckingLiked}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 ${
                    isLiked
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <ThumbsUp size={18} className={isLiked ? 'fill-current' : ''} />
                  {isLiked ? 'Liked' : 'Like'}
                </button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile: Bottom Sheet */}
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent 
          side="bottom" 
          className="md:hidden h-[90vh] p-0 bg-slate-900 border-t border-slate-800"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{article.title}</SheetTitle>
            <SheetDescription>Article details</SheetDescription>
          </SheetHeader>

          {/* Scrollable Content */}
          <div className="h-full rounded-2xl overflow-y-auto">
            {/* Featured Image */}
            {article.image_url && (
              <div className="relative w-full h-56 bg-slate-800">
                <Image
                  src={article.image_url}
                  alt={article.title}
                  fill
                  className="object-cover"
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

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={handleLike}
                  disabled={isPending || isCheckingLiked}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all disabled:opacity-50 ${
                    isLiked
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  <ThumbsUp size={18} className={isLiked ? 'fill-current' : ''} />
                  {isLiked ? 'Liked' : 'Like'}
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
