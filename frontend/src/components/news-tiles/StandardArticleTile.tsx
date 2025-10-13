// src/components/StandardArticleTile.tsx

import React from 'react';
import Link from 'next/link';
import { Article } from '@/types';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
interface StandardArticleTileProps {
  article: Article;
}

const StandardArticleTile: React.FC<StandardArticleTileProps> = ({ article }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col">
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
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{article.source}</p>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex-grow">
          {article.title}
        </h3>
        {article.summary && (
          <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">
            {article.summary.length > 100 ? `${article.summary.substring(0, 300)}...` : article.summary}
          </p>
        )}
        <div className="mt-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
             <button className="text-gray-400 hover:text-green-500"><ThumbsUp /></button>
             <button className="text-gray-400 hover:text-red-500"><ThumbsDown /></button>
          </div>
          <Link href={`/article/${article.id}`} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
            Read More
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StandardArticleTile;