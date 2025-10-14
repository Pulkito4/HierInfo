import React, { useState } from "react";
import { Article } from "@/types"; 
import ArticleActions from "./ArticleActions";

interface FeaturedArticleTileProps {
  article: Article;
}

const FeaturedArticleTile: React.FC<FeaturedArticleTileProps> = ({ article }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [fullContent, setFullContent] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // If no image, use a gradient background instead
  const tileStyle = article.image_url 
    ? {
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${article.image_url})`,
      }
    : {
        background: 'linear-gradient(45deg, #0d1b2a 0%, #2a3a5c 100%)', // Fallback gradient
      };

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

  return (
    <div
      className={`w-full ${isExpanded ? 'h-auto min-h-96' : 'h-96'} rounded-lg bg-cover bg-center text-white p-8 flex flex-col justify-end relative overflow-hidden group transition-all duration-300`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
        style={tileStyle}
      ></div>
      
      <div className="relative z-10">
        <h2 className="text-3xl font-bold leading-tight mb-2">
          {article.title}
        </h2>

        {/* Article Content */}
        <div className="mb-4">
          {!isExpanded ? (
            // Show truncated summary
            article.summary && (
              <p className="text-sm backdrop-blur-2xl font-medium text-white opacity-90">
                {article.summary.length > 250 ? `${article.summary.substring(0, 250)}...` : article.summary}
              </p>
            )
          ) : (
            // Show full content when expanded
            <div className="text-sm opacity-90 max-h-64 overflow-y-auto">
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

export default FeaturedArticleTile;
