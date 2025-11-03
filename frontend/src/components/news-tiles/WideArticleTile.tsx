'use client';

import ArticleActions from "./ArticleActions";
import { useState } from "react";
import Image from "next/image";
import type { Article } from "@/types/articles";

type WideArticleTileProps = {
  article: Article;
};

const WideArticleTile: React.FC<WideArticleTileProps> = ({ article }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const handleReadMore = () => {
    setIsExpanded((v) => !v);
  };
  return (
    <div 
      style={{ background: "linear-gradient(45deg, #16222A 0%, #3a2d5b 100%)" }} 
      className={`dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex ${
        isExpanded 
          ? 'h-auto min-h-80 flex-col' 
          : 'h-auto min-h-48 sm:min-h-64 flex-col sm:flex-row'
      } transition-all duration-300`}
    >
      {/* Only render image section if image exists */}
      {article.image_url && (
        <div className={`relative overflow-hidden ${
          isExpanded 
            ? 'w-full h-56' 
            : 'w-full h-40 sm:w-1/3 sm:h-64'
        }`}>
          <Image
            src={article.image_url}
            alt={article.title}
            width={400}
            height={195}
            className="w-full h-full object-cover"
            unoptimized
          />
        </div>
      )}
      
      {/* Content section - adjust width based on image presence */}
      <div className={`${
        article.image_url && !isExpanded 
          ? 'w-full sm:w-2/3' 
          : 'w-full'
      } p-4 sm:p-6 flex flex-col justify-between flex-1`}>
        <div>
          {/* <p className="text-xs font-semibold text-gray-500 mb-1">{article.source}</p> */}
          <h3 className="text-lg sm:text-md font-bold text-gray-100 dark:text-white mb-2 leading-tight">
            {article.title}
          </h3>
          
          {/* Article Content */}
          {!isExpanded ? (
            article.summary && (
              <div className="text-gray-200 dark:text-gray-300 text-lg sm:text-base leading-relaxed">
                {/* Mobile: Show shorter text, Desktop: Show longer text */}
                <p className="block sm:hidden">
                  {article.summary.length > 120 
                    ? `${article.summary.substring(0, 120)}...` 
                    : article.summary}
                </p>
                <p className="hidden sm:block">
                  {article.summary.length > 200 
                    ? `${article.summary.substring(0, 200)}...` 
                    : article.summary}
                </p>
              </div>
            )
          ) : (
            <div className="text-gray-200 dark:text-gray-300 text-lg sm:text-base">
              <p className="whitespace-pre-line mb-4 leading-relaxed">{article.summary || ''}</p>
            </div>
          )}
        </div>
        
        <div className="mt-auto pt-3">
          <ArticleActions
            article={article}
            variant="light"
            size="md"
            onLike={(id) => console.log('Liked article:', id)}
            onDislike={(id) => console.log('Disliked article:', id)}
            onReadMore={handleReadMore}
            isExpanded={isExpanded}
            className="text-lg sm:text-md"
          />
        </div>
      </div>
    </div>
  );
};
export default WideArticleTile;