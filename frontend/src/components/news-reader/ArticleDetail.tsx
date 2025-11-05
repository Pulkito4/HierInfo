'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Article } from '@/types/articles';
import { ExternalLink, Calendar, ThumbsUp } from 'lucide-react';
import { useArticleActivity } from '@/hooks/useArticleActivity';
import { useArticleImpression } from '@/hooks/useArticleImpression';
import { checkArticleLiked } from '@/lib/react-query/queries';

interface ArticleDetailProps {
  article: Article | null;
}

const ArticleDetail: React.FC<ArticleDetailProps> = ({ article }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isCheckingLiked, setIsCheckingLiked] = useState(false);
  const { trackActivity, isPending } = useArticleActivity(article?.id || '');
  
  // Track impression when article is viewed
  const { ref: impressionRef } = useArticleImpression(article?.id || '', {
    delay: 1000,
    threshold: 0.3,
  });

  // Check if article is already liked when article changes
  useEffect(() => {
    if (!article?.id) {
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
  }, [article?.id]);

  const handleLike = () => {
    if (!article || isPending) return;
    
    trackActivity('like');
    setIsLiked(true);
    
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
    </article>
  );
};

export default ArticleDetail;
