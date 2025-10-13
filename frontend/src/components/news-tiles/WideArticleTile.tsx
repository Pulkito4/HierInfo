import { Article } from "@/types";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import Link from "next/link";

const WideArticleTile: React.FC<{ article: Article }> = ({ article }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex h-48">
      {/* Only render image section if image exists */}
      {article.image_url && (
        <div className="w-1/3">
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      {/* Content section - adjust width based on image presence */}
      <div className={`${article.image_url ? 'w-2/3' : 'w-full'} p-6 flex flex-col justify-between`}>
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1">{article.source}</p>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {article.title}
          </h3>
          {article.summary && (
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              {article.summary.length > 250 ? `${article.summary.substring(0, 300)}...` : article.summary}
            </p>
          )}
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <div className="flex space-x-2">
            <button className="text-gray-400 hover:text-green-500"><ThumbsUp /></button>
            <button className="text-gray-400 hover:text-red-500"><ThumbsDown /></button>
          </div>
          <Link href={`/article/${article.id}`} className="text-sm font-semibold text-blue-600">
            Read More
          </Link>
        </div>
      </div>
    </div>
  );
};
export default WideArticleTile;