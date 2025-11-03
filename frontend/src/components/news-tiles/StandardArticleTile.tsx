'use client';

// src/components/StandardArticleTile.tsx

import React, { useState } from 'react';
import Image from 'next/image';
import ArticleActions from './ArticleActions';
import type { Article } from '@/types/articles';

type StandardArticleTileProps = {
  article: Article;
};

const StandardArticleTile: React.FC<StandardArticleTileProps> = ({ article }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const handleReadMore = () => {
    setIsExpanded((v) => !v);
  };

  return (
    <div
      style={{ background: "linear-gradient(45deg, #141e30 0%, #243b55 100%)" }}
      className=" dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col"
    >
      {article.image_url && (
  
          <Image
            src={article.image_url}
            alt={article.title}
            width={400}
            height={192}
            className="w-full h-48 object-cover"
            unoptimized // Since external URLs might not be compatible with Next.js Image optimization
          />
       
      )}
      <div className="p-4 flex flex-col flex-grow">
        {/* <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{article.source}</p> */}
        <h3 className="text-lg font-bold text-gray-100 dark:text-white mb-2 flex-grow">
          {article.title}
        </h3>
        {/* Article Content */}
        <div className="mb-4">
          {!isExpanded ? (
            // Show truncated summary
            article.summary && (
              <p className="text-gray-200 dark:text-gray-300 text-sm">
                {article.summary.length > 150 ? `${article.summary.substring(0, 150)}...` : article.summary}
              </p>
            )
          ) : (
            // Show full content when expanded
            <div className="text-gray-200 dark:text-gray-300 text-sm">
              <p className="whitespace-pre-line">{article.summary || ''}</p>
            </div>
          )}
        </div>

        <div className="mt-auto">
          <ArticleActions
            article={article}
            variant="light"
            size="lg"
            onLike={(id) => console.log('Liked article:', id)}
            onDislike={(id) => console.log('Disliked article:', id)}
            onReadMore={handleReadMore}
            isExpanded={isExpanded}
          />
        </div>
      </div>
    </div>
  );
};

export default StandardArticleTile;