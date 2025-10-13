// src/components/StandardArticleTile.tsx

import React from 'react';
import Link from 'next/link';
import { Article } from '@/types';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import ArticleActions from './ArticleActions';
interface StandardArticleTileProps {
  article: Article;
}

const StandardArticleTile: React.FC<StandardArticleTileProps> = ({ article }) => {
    const tileStyle = article.image_url 
    ? {
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url(${article.image_url})`,
      }
    : {
        background: ' linear-gradient(45deg, #0b1120 0%, #1a2a4c 100%)', // Different gradient for variety
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
        {article.summary && (
          <p className="text-gray-200 dark:text-gray-300 text-sm mb-4">
            {article.summary.length > 100 ? `${article.summary.substring(0, 300)}...` : article.summary}
          </p>
        )}
        <div className="mt-auto">
          <ArticleActions
            article={article}
            variant="light"
            size="lg"
            onLike={(id) => console.log('Liked article:', id)}
            onDislike={(id) => console.log('Disliked article:', id)}
          />
        </div>
      </div>
    </div>
  );
};

export default StandardArticleTile;