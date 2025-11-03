import React from 'react';
import StandardArticleTile from './StandardArticleTile';
import FeaturedArticleTile from './FeaturedArticleTile';
import WideArticleTile from './WideArticleTile';
import CompactFeaturedTile from './CompactFeaturedTile';
import type { Article } from '@/types/articles';

type AllTilesProps = {
  articles: Article[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  showFeatured?: boolean;
};

type LayoutSection = {
  type: 'featured' | 'standard-pair' | 'wide' | 'compact-featured-pair';
  articles: Article[];
  className: string;
};

const AllTiles: React.FC<AllTilesProps> = ({ articles }) => {
  const createLayoutPattern = (articleList: Article[]): LayoutSection[] => {
    const layout: LayoutSection[] = [];
    let index = 0;

    while (index < articleList.length) {
      // Pattern: Featured -> 2 Standard -> 1 Wide -> 2 Compact Featured
      
      // 1. Featured article (if available)
      if (index < articleList.length) {
        layout.push({
          type: 'featured',
          articles: [articleList[index]],
          className: 'col-span-1 md:col-span-2 lg:col-span-3' // Full width
        });
        index++;
      }

      // 2. Two standard articles side by side
      if (index < articleList.length) {
        const standardArticles = articleList.slice(index, index + 2);
        layout.push({
          type: 'standard-pair',
          articles: standardArticles,
          className: 'col-span-1 md:col-span-2 lg:col-span-3' // Container for 2 articles
        });
        index += standardArticles.length;
      }

      // 3. One wide article (if available)
      if (index < articleList.length) {
        layout.push({
          type: 'wide',
          articles: [articleList[index]],
          className: 'col-span-1 md:col-span-2 lg:col-span-3' // Full width
        });
        index++;
      }

      // 4. Two compact featured articles side by side
      if (index < articleList.length) {
        const compactArticles = articleList.slice(index, index + 2);
        layout.push({
          type: 'compact-featured-pair',
          articles: compactArticles,
          className: 'col-span-1 md:col-span-2 lg:col-span-3' // Container for 2 articles
        });
        index += compactArticles.length;
      }
    }

    return layout;
  };

  const layoutPattern = createLayoutPattern(articles);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {layoutPattern.map((section, sectionIndex) => (
          <div key={sectionIndex} className={section.className}>
            {section.type === 'featured' && (
              <FeaturedArticleTile article={section.articles[0]} />
            )}
            
            {section.type === 'standard-pair' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {section.articles.map((article) => (
                  <StandardArticleTile key={article.id} article={article} />
                ))}
              </div>
            )}
            
            {section.type === 'wide' && (
              <WideArticleTile article={section.articles[0]} />
            )}
            
            {section.type === 'compact-featured-pair' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {section.articles.map((article) => (
                  <CompactFeaturedTile key={article.id} article={article} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Load more button and other existing code */}
    </div>
  );
};

export default AllTiles;