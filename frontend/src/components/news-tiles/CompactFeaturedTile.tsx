import { Article } from "@/types";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import Link from "next/link";
import ArticleActions from "./ArticleActions";

const CompactFeaturedTile: React.FC<{ article: Article }> = ({ article }) => {
  const tileStyle = article.image_url 
    ? {
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url(${article.image_url})`,
      }
    : {
        background: ' linear-gradient(45deg, #141e30 0%, #243b55 100%)', // Different gradient for variety
      };

  return (
    <Link
      href={`/article/${article.id}`}
      className="block w-full h-64 rounded-lg bg-cover bg-center text-white p-6 flex flex-col justify-end relative overflow-hidden group"
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
        style={tileStyle}
      ></div>
      
      <div className="relative z-10">
        <h3 className="text-lg font-bold leading-tight mb-2">
        {article.title}
        </h3>
        {article.summary && (
          <p className="text-sm opacity-90 mb-4">
            {article.summary.length > 150 ? `${article.summary.substring(0, 150)}...` : article.summary}
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
    </Link>
  );
};

export default CompactFeaturedTile;