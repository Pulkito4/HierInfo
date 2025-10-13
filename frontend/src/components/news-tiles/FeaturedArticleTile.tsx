//A large, prominent tile used for the top story in the "For You" section.
// It would feature a large background image with the title and source overlaid.

// src/components/FeaturedArticleTile.tsx

import React from "react";
import Link from "next/link";
import { Article } from "@/types"; // Adjust import path as needed
import { ThumbsDown, ThumbsUp } from "lucide-react";

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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Fallback gradient
      };

  return (
    <Link
      href={`/article/${article.id}`}
      className="block w-full h-96 rounded-lg bg-cover bg-center text-white p-8 flex flex-col justify-end relative overflow-hidden group"
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
        
        <div className="flex justify-between items-center">
          <p className="text-sm font-semibold opacity-80">
            Source: {article.source}
          </p>
          <div className="flex space-x-3">
            <button className="text-gray-300 hover:text-[#49E8C6]">
              <ThumbsUp />
            </button>
            <button className="text-gray-300 hover:text-red-500">
              <ThumbsDown />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default FeaturedArticleTile;
