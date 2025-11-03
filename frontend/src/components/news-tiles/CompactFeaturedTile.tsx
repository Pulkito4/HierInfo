'use client';

import ArticleActions from "./ArticleActions";
import { useState } from "react";
import type { Article } from "@/types/articles";

type CompactFeaturedTileProps = {
  article: Article;
};

const CompactFeaturedTile: React.FC<CompactFeaturedTileProps> = ({ article }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [fullContent, setFullContent] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  const handleReadMore = async () => {
    if (!isExpanded && !fullContent) {
      setIsLoadingContent(true);
      try {
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
  const tileStyle = article.image_url 
    ? {
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url(${article.image_url})`,
      }
    : {
        background: ' linear-gradient(45deg, #141e30 0%, #243b55 100%)', // Different gradient for variety
      };

  return (
    <div
      className={`w-full ${isExpanded ? 'h-auto min-h-64' : 'h-84'} rounded-lg bg-cover bg-center text-white p-6 flex flex-col justify-end relative overflow-hidden group transition-all duration-300`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
        style={tileStyle}
      ></div>
      
      <div className="relative z-10">
        <h3 className="text-lg font-bold leading-tight mb-2">
        {article.title}
        </h3>
        
        {/* Article Content */}
        <div className="mb-4">
          {!isExpanded ? (
            article.summary && (
              <p className="text-sm backdrop-blur-2xl font-medium opacity-90">
                {article.summary.length > 120 ? `${article.summary.substring(0, 120)}...` : article.summary}
              </p>
            )
          ) : (
            <div className="text-sm opacity-90 max-h-40 overflow-y-auto">
              {isLoadingContent ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-white/30 rounded mb-2"></div>
                  <div className="h-4 bg-white/30 rounded mb-2"></div>
                  <div className="h-4 bg-white/30 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                 <p className="whitespace-pre-line bg-black/60 backdrop-blur-lg text-white font-medium p-4 rounded-lg">
  {fullContent}
</p>
                  
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-auto">
          <ArticleActions
            article={article}
            variant="overlay"
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

export default CompactFeaturedTile;