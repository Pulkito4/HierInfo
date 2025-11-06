'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ThumbsUp } from 'lucide-react';
import type { Article } from '@/types/articles';

interface HeroBannerProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
  onLike: (articleId: string) => void;
}

const HeroBanner: React.FC<HeroBannerProps> = ({ articles, onArticleClick, onLike }) => {
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

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentArticle) {
      onLike(currentArticle.id);
    }
  };

  if (limitedArticles.length === 0) return null;

  return (
    <div className="relative w-full h-[400px] md:h-[500px] rounded-xl overflow-hidden bg-slate-900 group">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 cursor-pointer flex flex-col md:flex-row"
          onClick={() => onArticleClick(currentArticle)}
        >
          {/* Image Section - Full width on mobile, 60% on desktop */}
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
              <div className="w-full h-full bg-gradient-to-br from-blue-900 via-slate-800 to-slate-900" />
            )}
            <div className="absolute inset-0 bg-black/30" />
          </div>

          {/* Content Section - Full width on mobile, 40% on desktop */}
          <div className="w-full md:w-[40%] h-[40%] md:h-full p-4 md:p-6 flex flex-col justify-between bg-black/70 backdrop-blur-md text-white">
            {/* Title */}
            <h2 className="text-lg md:text-2xl font-bold mb-2 md:mb-4 leading-tight md:leading-snug line-clamp-3 md:line-clamp-none">
              {currentArticle.title}
            </h2>

            {/* Summary - Hidden on mobile */}
            <div className="hidden md:block flex-1 overflow-hidden">
              <p className="text-sm text-white/90 line-clamp-4">
                {currentArticle.summary}
              </p>
            </div>

            {/* Bottom Section */}
            <div className="flex items-center justify-between mt-auto">
              {/* Source */}
              <div className="text-xs md:text-sm text-white/80">
                <p className="font-semibold">{currentArticle.source}</p>
              </div>

              {/* Like Button */}
              <button
                onClick={handleLike}
                className="p-2 md:p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all"
                aria-label="Like article"
              >
                <ThumbsUp size={18} className="md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ✅ Navigation Arrows */}
      {limitedArticles.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100 z-10"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100 z-10"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* ✅ Dots Indicator */}
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
                index === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroBanner;
