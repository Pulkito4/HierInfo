// src/components/StandardArticleTile.tsx

import React, { useState } from 'react';
import Link from 'next/link';
import { Article } from '@/types';
import { ThumbsDown, ThumbsUp, ExternalLink } from 'lucide-react';
import ArticleActions from './ArticleActions';

interface StandardArticleTileProps {
  article: Article;
}

const StandardArticleTile: React.FC<StandardArticleTileProps> = ({ article }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [fullContent, setFullContent] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  const handleReadMore = async (articleId: string) => {
    if (!isExpanded && !fullContent) {
      // Fetch full article content
      setIsLoadingContent(true);
      try {
        // You can fetch the full content from your API here
        // For now, I'll simulate with a timeout and use the summary + URL
        await new Promise(resolve => setTimeout(resolve, 500));
        setFullContent(
          `${article.summary || ''}\n`
        );
      } catch (error) {
        console.error('Error loading full content:', error);
        setFullContent('Error loading full content. Please try again.');
      } finally {
        setIsLoadingContent(false);
      }
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <div  style={{ background: "linear-gradient(45deg, #141e30 0%, #243b55 100%)" }} className=" dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col">
      {article.image_url && (
        <Link href={`/article/${article.id}`} className="block">
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-48 object-cover"
          />
        </Link>
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
              {isLoadingContent ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-600 rounded mb-2"></div>
                  <div className="h-4 bg-gray-600 rounded mb-2"></div>
                  <div className="h-4 bg-gray-600 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <p className="whitespace-pre-line">{fullContent}</p>
                </>
              )}
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