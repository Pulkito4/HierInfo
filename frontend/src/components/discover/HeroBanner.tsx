'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Zap, TrendingUp } from 'lucide-react';
import type { Article } from '@/types/articles';

interface HeroBannerProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
  onLike: (articleId: string) => void;
}

const HeroBanner: React.FC<HeroBannerProps> = ({ articles, onArticleClick }) => {
  const limitedArticles = articles.slice(0, 5);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const currentArticle = limitedArticles[currentIndex];

  useEffect(() => {
    if (!isAutoPlaying || limitedArticles.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % limitedArticles.length);
    }, 7000);

    return () => clearInterval(timer);
  }, [isAutoPlaying, limitedArticles.length]);

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % limitedArticles.length);
  };

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + limitedArticles.length) % limitedArticles.length);
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  if (limitedArticles.length === 0) return null;

  const isCritical = currentArticle.is_critical;
  const isTrending = currentArticle.trending_score && currentArticle.trending_score > 10;

  return (
    <div className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden bg-gradient-to-br from-white to-slate-50 group border border-slate-200 shadow-lg">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 cursor-pointer flex flex-col md:flex-row"
          onClick={() => onArticleClick(currentArticle)}
        >
          {/* Image Section */}
          <div className="relative w-full md:w-[60%] h-[60%] md:h-full">
            {currentArticle.image_url ? (
              <Image
                src={currentArticle.image_url}
                alt={currentArticle.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 60vw"
                priority={currentIndex === 0}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-coral/10 via-teal/5 to-slate-100" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#FFFBF5] via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-[#FFFBF5]/80" />
            
            {/* Badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              {isCritical && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500 text-white shadow-lg">
                  <Zap className="w-3 h-3" />
                  Breaking
                </span>
              )}
              {isTrending && !isCritical && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gold text-slate-800 shadow-lg">
                  <TrendingUp className="w-3 h-3" />
                  Trending
                </span>
              )}
            </div>
          </div>

          {/* Content Section */}
          <div className="w-full md:w-[40%] h-[40%] md:h-full p-5 md:p-8 flex flex-col justify-between bg-white/95 backdrop-blur-sm">
            {/* Category */}
            <div className="mb-3">
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-coral/10 text-coral border border-coral/20">
                {currentArticle.categories?.[0]?.name || 'Featured'}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-3 leading-tight line-clamp-3">
              {currentArticle.title}
            </h2>

            {/* Summary */}
            <div className="hidden md:block flex-1 overflow-hidden">
              <p className="text-sm text-slate-500 line-clamp-4 leading-relaxed">
                {currentArticle.summary}
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-200">
              <span className="text-sm font-semibold text-coral">{currentArticle.source}</span>
              <span className="text-xs text-slate-400">
                {new Date(currentArticle.published_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      {limitedArticles.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 text-slate-600 hover:text-coral hover:border-coral/50 transition-all opacity-0 group-hover:opacity-100 z-10"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 text-slate-600 hover:text-coral hover:border-coral/50 transition-all opacity-0 group-hover:opacity-100 z-10"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {limitedArticles.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {limitedArticles.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                goToSlide(index);
              }}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex ? 'w-8 bg-coral' : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroBanner;
