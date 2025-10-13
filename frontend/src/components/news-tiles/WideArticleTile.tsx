import { Article } from "@/types";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import Link from "next/link";
import ArticleActions from "./ArticleActions";

const WideArticleTile: React.FC<{ article: Article }> = ({ article }) => {
  return (
    <div style={{ background: "linear-gradient(45deg, #16222A 0%, #3a2d5b 100%)" }} className=" dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex h-48" >
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
          {/* <p className="text-xs font-semibold text-gray-500 mb-1">{article.source}</p> */}
          <h3 className="text-xl font-bold text-gray-100 dark:text-white mb-2">
            {article.title}
          </h3>
          {article.summary && (
            <p className="text-gray-200 dark:text-gray-300 text-sm">
              {article.summary.length > 250 ? `${article.summary.substring(0, 300)}...` : article.summary}
            </p>
          )}
        </div>
        
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
export default WideArticleTile;