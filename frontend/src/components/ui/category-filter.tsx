import React from 'react';
import { Category } from '@/types';
import { Button } from '@/components/ui/button';


interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  loading?: boolean;
  className?: string;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  loading = false,
  className = ''
}) => {
  if (loading) {
    return (
      <div className={`flex space-x-2 ${className}`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 bg-gray-300 dark:bg-gray-700 rounded-full w-20 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {/* All Articles Option */}
      <Button
        variant={selectedCategory === null ? "default" : "outline"}
        size="sm"
        onClick={() => onCategoryChange(null)}
        className="rounded-full"
      >
        All
      </Button>

      {/* Category Options */}
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryChange(category.id)}
          className="rounded-full"
        >
          {category.name}
        </Button>
      ))}
    </div>
  );
};

export default CategoryFilter;