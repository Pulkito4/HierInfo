import { useState, useEffect, useCallback } from 'react';

import { Category, LoadingState } from '@/types';
import { NewsService } from '@/lib/newService';

interface UseCategoriesReturn {
  categories: Category[];
  loading: LoadingState;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [error, setError] = useState<Error | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading('loading');
    setError(null);

    try {
      const response = await NewsService.fetchCategories();
      
      if (response.error) {
        throw response.error;
      }

      setCategories(response.categories);
      setLoading('success');
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err as Error);
      setLoading('error');
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
  };
}