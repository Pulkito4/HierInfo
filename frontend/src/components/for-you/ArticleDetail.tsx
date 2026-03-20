'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import type { Article } from '@/types/articles';
import { ThumbsUp, ChevronLeft, ChevronRight, ExternalLink, Share2, Bookmark, Clock } from 'lucide-react';
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
        // User cancelled
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
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-coral/20 to-coral-light/20 rounded-2xl flex items-center justify-center mb-6 border border-coral/30">
          <svg className="w-10 h-10 text-coral" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">
          Select an article to read
        </h3>
        <p className="text-slate-500">
          Choose any article from the list on the left to view its full details
        </p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative min-h-full bg-[#FFFBF5]"
    >
      <article ref={impressionRef} className="max-w-4xl mx-auto p-6 lg:p-8 animate-in fade-in duration-300">
        {/* Article Header */}
        <header className="mb-6">
          {/* Category Badge */}
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
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4 leading-tight">
            {article.title}
          </h1>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="font-semibold text-coral">{article.source}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <time dateTime={article.published_at}>
                {formatDate(article.published_at)}
              </time>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {article.image_url && (
          <figure className="mb-6 rounded-2xl overflow-hidden border border-slate-200">
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
          <div className="mb-6">
            <div className="prose prose-lg max-w-none">
              <p className="text-slate-600 leading-relaxed text-base">
                {article.summary}
              </p>
            </div>
          </div>
        )}

        {/* Keywords/Tags */}
        {article.keywords && article.keywords.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-500 mb-3">Related Topics</h3>
            <div className="flex flex-wrap gap-2">
              {article.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 hover:border-coral/30 transition-colors"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-between py-6 border-t border-slate-200">
          <div className="flex items-center gap-3">
            {/* Like Button */}
            <button
              onClick={handleLike}
              disabled={isPending || localIsLiked || isCheckingLiked}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all
                ${localIsLiked 
                  ? 'bg-coral/10 text-coral border border-coral/30' 
                  : 'bg-slate-100 text-slate-600 border border-slate-200 hover:border-coral/30 hover:text-coral'
                }
                ${(isPending || isCheckingLiked) ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <ThumbsUp 
                size={18} 
                className={localIsLiked ? 'fill-current' : ''}
              />
              <span>{localIsLiked ? 'Liked' : 'Like'}</span>
            </button>

            {/* Bookmark Button */}
            <button
              onClick={handleBookmark}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all
                ${isBookmarked 
                  ? 'bg-gold/20 text-gold-dark border border-gold/30' 
                  : 'bg-slate-100 text-slate-600 border border-slate-200 hover:border-gold/30 hover:text-gold-dark'
                }
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
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all bg-slate-100 text-slate-600 border border-slate-200 hover:border-coral/30 hover:text-coral"
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
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all bg-gradient-to-r from-coral to-coral-light text-white hover:from-coral-dark hover:to-coral shadow-lg shadow-coral/25"
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
          <div className="flex gap-4 items-center justify-between pt-6 border-t border-slate-200">
            {hasPrevious ? (
              <button
                onClick={onPrevious}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-all border border-slate-200"
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
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-coral to-coral-light hover:from-coral-dark hover:to-coral text-white font-medium transition-all shadow-lg shadow-coral/25"
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
