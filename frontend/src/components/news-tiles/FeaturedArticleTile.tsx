//A large, prominent tile used for the top story in the "For You" section.
// It would feature a large background image with the title and source overlaid.

// src/components/FeaturedArticleTile.tsx

import React from "react";
import Link from "next/link";
import { Article } from "@/types"; // Adjust import path as needed
import { ThumbsDown, ThumbsUp } from "lucide-react";
import ArticleActions from "./ArticleActions";

interface FeaturedArticleTileProps {
  article: Article;
}

const FeaturedArticleTile: React.FC<FeaturedArticleTileProps> = ({ article }) => {
  // If no image, use a gradient background instead
  const tileStyle = article.image_url 
    ? {
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${article.image_url})`,
      }
    : {
        background: 'linear-gradient(45deg, #0d1b2a 0%, #2a3a5c 100%)', // Fallback gradient
      };

  const handleTileClick = () => {
    window.location.href = `/article/${article.id}`;
  };

  return (
    <div
      className="w-full h-96 rounded-lg bg-cover bg-center text-white p-8 flex flex-col justify-end relative overflow-hidden group cursor-pointer"
      onClick={handleTileClick}
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
        style={tileStyle}
      ></div>
      
      <div className="relative z-10">
        <h2 className="text-3xl font-bold leading-tight mb-2">
          {article.title}
        </h2>

        {article.summary && (
          <p className="text-sm opacity-90 mb-4">
            {article.summary.length > 350 ? `${article.summary.substring(0, 350)}...` : article.summary}
          </p>
        )}
        
         <div className="mt-auto">
          <ArticleActions
            article={article}
            variant="overlay"
            size="lg"
            onLike={(id) => console.log('Liked article:', id)}
            onDislike={(id) => console.log('Disliked article:', id)}
          />
        </div>
      </div>
    </div>
  );
};

export default FeaturedArticleTile;
