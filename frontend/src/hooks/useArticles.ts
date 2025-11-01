import { useState, useEffect, useCallback, useMemo } from 'react';

import { Article, LoadingState, PaginationState } from '@/types';
import { FetchArticlesOptions, NewsService } from '@/lib/newService';

interface UseArticlesOptions extends FetchArticlesOptions {
  enabled?: boolean; // Whether to auto-fetch on mount
  refetchInterval?: number; // Auto-refetch interval in ms
}

interface UseArticlesReturn {
  articles: Article[];
  loading: LoadingState;
  error: Error | null;
  pagination: PaginationState;
  refetch: () => Promise<void>;
  fetchMore: () => Promise<void>;
  hasMore: boolean;
  refresh: () => Promise<void>;
}

export function useArticles(options: UseArticlesOptions = {}): UseArticlesReturn {
  const {
    enabled = true,
    refetchInterval,
    limit = 20,
    ...fetchOptions
  } = options;

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const pagination: PaginationState = useMemo(() => ({
    page,
    limit,
    total: totalCount,
    hasNextPage: (page + 1) * limit < totalCount,
    hasPreviousPage: page > 0,
  }), [page, limit, totalCount]);

  const fetchArticles = useCallback(async (reset: boolean = false) => {
    if (loading === 'loading') return; // Prevent concurrent requests

    setLoading('loading');
    setError(null);

    try {
      const currentOffset = reset ? 0 : page * limit;
      const response = await NewsService.fetchArticles({
        ...fetchOptions,
        limit,
        offset: currentOffset,
      });

      if (response.error) {
        throw response.error;
      }

      if (reset) {
        setArticles(response.articles);
        setPage(0);
      } else {
        setArticles(prev => [...prev, ...response.articles]);
      }

      setTotalCount(response.count || 0);
      setLoading('success');
    } catch (err) {
      console.error('Error fetching articles:', err);
      setError(err as Error);
      setLoading('error');
    }
  }, [fetchOptions, limit, page, loading]);

  const refetch = useCallback(async () => {
    await fetchArticles(true);
  }, [fetchArticles]);

  const fetchMore = useCallback(async () => {
    if (!pagination.hasNextPage || loading === 'loading') return;
    setPage(prev => prev + 1);
  }, [pagination.hasNextPage, loading]);

  const refresh = useCallback(async () => {
    setArticles([]);
    setPage(0);
    setTotalCount(0);
    await fetchArticles(true);
  }, [fetchArticles]);

  // Initial fetch
  useEffect(() => {
    if (enabled && loading === 'idle') {
      fetchArticles(true);
    }
  }, [enabled, loading, fetchOptions.categoryId, fetchOptions.onlyTrending, fetchOptions.onlyCritical, fetchArticles]);

  // Fetch more when page changes
  useEffect(() => {
    if (page > 0 && loading !== 'loading') {
      fetchArticles(false);
    }
  }, [page, loading, fetchArticles]);

  // Auto-refetch interval
  useEffect(() => {
    if (!refetchInterval || !enabled) return;

    const interval = setInterval(() => {
      refetch();
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [refetchInterval, enabled, refetch]);

  return {
    articles,
    loading,
    error,
    pagination,
    refetch,
    fetchMore,
    hasMore: pagination.hasNextPage,
    refresh,
  };
}

// Hook for user-specific feed
export function useUserFeed(userId: string | null, options: Omit<UseArticlesOptions, 'userId'> = {}) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [message, setMessage] = useState<string | undefined>();
  const [metadata, setMetadata] = useState<Record<string, unknown> | undefined>();

  const { limit = 20, ...restOptions } = options;

  const pagination: PaginationState = useMemo(() => ({
    page: 0,
    limit,
    total: totalCount,
    hasNextPage: false,
    hasPreviousPage: false,
  }), [limit, totalCount]);

  const fetchUserFeed = useCallback(async () => {
    if (!userId || loading === 'loading') return;

    setLoading('loading');
    setError(null);

    try {
      const response = await NewsService.fetchUserFeedArticles(userId, {
        ...restOptions,
        limit,
      });
      
      if (response.error) {
        throw response.error;
      }

      setArticles(response.articles);
      setTotalCount(response.count || response.articles.length);
      setMessage(response.message);
      setMetadata(response.metadata);
      setLoading('success');
    } catch (err) {
      console.error('Error fetching user feed:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        error: err
      });
      setError(err as Error);
      setLoading('error');
    }
  }, [userId, restOptions, limit, loading]);

  const fetchMore = useCallback(async () => {
    return;
  }, []);

  const refresh = useCallback(async () => {
    setArticles([]);
    setTotalCount(0);
    setMessage(undefined);
    setMetadata(undefined);
    await fetchUserFeed();
  }, [fetchUserFeed]);

  // Initial fetch
  useEffect(() => {
    if (userId && options.enabled !== false && loading === 'idle') {
      fetchUserFeed();
    }
  }, [userId, loading, restOptions.categoryId, restOptions.onlyTrending, restOptions.onlyCritical, fetchUserFeed, options.enabled]);

  return {
    articles,
    loading,
    error,
    pagination,
    refetch: () => fetchUserFeed(),
    fetchMore,
    hasMore: false,
    refresh,
    message,
    metadata,
  };
}


// Hook for single article
export function useArticle(articleId: string | null) {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [error, setError] = useState<Error | null>(null);

  const fetchArticle = useCallback(async () => {
    if (!articleId) return;

    setLoading('loading');
    setError(null);

    try {
      const response = await NewsService.fetchArticleById(articleId);
      
      if (response.error) {
        throw response.error;
      }

      setArticle(response.article);
      setLoading('success');
    } catch (err) {
      console.error('Error fetching article:', err);
      setError(err as Error);
      setLoading('error');
    }
  }, [articleId]);

  useEffect(() => {
    if (articleId) {
      fetchArticle();
    }
  }, [articleId, fetchArticle]);

  return {
    article,
    loading,
    error,
    refetch: fetchArticle,
  };
}