import { Article } from "@/types";
import ArticleActions from "./ArticleActions";
import { useState } from "react";

const WideArticleTile: React.FC<{ article: Article }> = ({ article }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [fullContent, setFullContent] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  const handleReadMore = async (articleId: string) => {
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
      style={{ background: "linear-gradient(45deg, #16222A 0%, #3a2d5b 100%)" }} 
      className={`dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex ${
        isExpanded 
          ? 'h-auto min-h-48 flex-col' 
          : 'h-auto min-h-32 sm:h-48 flex-col sm:flex-row'
      } transition-all duration-300`}
    >
      {/* Only render image section if image exists */}
      {article.image_url && (
        <div className={`${
          isExpanded 
            ? 'w-full h-48' 
            : 'w-full h-32 sm:w-1/3 sm:h-48'
        }`}>
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      {/* Content section - adjust width based on image presence */}
      <div className={`${
        article.image_url && !isExpanded 
          ? 'w-full sm:w-2/3' 
          : 'w-full'
      } p-4 sm:p-6 flex flex-col justify-between flex-1`}>
        <div>
          {/* <p className="text-xs font-semibold text-gray-500 mb-1">{article.source}</p> */}
          <h3 className="text-lg sm:text-md font-bold text-gray-100 dark:text-white mb-2 leading-tight">
            {article.title}
          </h3>
          
          {/* Article Content */}
          {!isExpanded ? (
            article.summary && (
              <div className="text-gray-200 dark:text-gray-300 text-lg sm:text-base leading-relaxed">
                {/* Mobile: Show shorter text, Desktop: Show longer text */}
                <p className="block sm:hidden">
                  {article.summary.length > 120 
                    ? `${article.summary.substring(0, 120)}...` 
                    : article.summary}
                </p>
                <p className="hidden sm:block">
                  {article.summary.length > 200 
                    ? `${article.summary.substring(0, 200)}...` 
                    : article.summary}
                </p>
              </div>
            )
          ) : (
            <div className="text-gray-200 dark:text-gray-300 text-lg sm:text-base">
              {isLoadingContent ? (
                <div className="animate-pulse">
                  <div className="h-3 sm:h-4 bg-gray-600 rounded mb-2"></div>
                  <div className="h-3 sm:h-4 bg-gray-600 rounded mb-2"></div>
                  <div className="h-3 sm:h-4 bg-gray-600 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <p className="whitespace-pre-line mb-4 leading-relaxed">{fullContent}</p>
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-auto pt-3">
          <ArticleActions
            article={article}
            variant="light"
            size="md"
            onLike={(id) => console.log('Liked article:', id)}
            onDislike={(id) => console.log('Disliked article:', id)}
            onReadMore={handleReadMore}
            isExpanded={isExpanded}
            className="text-lg sm:text-md"
          />
        </div>
      </div>
    </div>
  );
};
export default WideArticleTile;