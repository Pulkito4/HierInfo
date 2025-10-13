import { Article } from "@/types";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import Link from "next/link";

const CompactFeaturedTile: React.FC<{ article: Article }> = ({ article }) => {
  const tileStyle = article.image_url 
    ? {
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url(${article.image_url})`,
      }
    : {
        background: 'linear-gradient(45deg, #ff6b6b 0%, #ee5a24 100%)', // Different gradient for variety
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
        <div className="flex justify-between items-center">
          <p className="text-xs opacity-80">{article.source}</p>
          <div className="flex space-x-1">
            <button className="text-gray-300 hover:text-green-400">
              <ThumbsUp size={16} />
            </button>
            <button className="text-gray-300 hover:text-red-400">
              <ThumbsDown size={16} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CompactFeaturedTile;