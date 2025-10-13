import { supabase } from './supabase';
import { Article, Category } from '@/types';

export interface FetchArticlesOptions {
  limit?: number;
  offset?: number;
  categoryId?: string;
  userId?: string;
  sortBy?: 'created_at' | 'published_at' | 'trending_score';
  sortOrder?: 'asc' | 'desc';
  onlyTrending?: boolean;
  onlyCritical?: boolean;
}

export class NewsService {
  private static requestCache = new Map<string, Promise<unknown>>();
  private static cacheTimeout = 30000; // 30 seconds

  /**
   * Create a cache key for requests
   */
  private static createCacheKey(method: string, params: unknown): string {
    return `${method}_${JSON.stringify(params)}`;
  }

  /**
   * Get or create a cached request
   */
  private static getCachedRequest<T>(
    key: string, 
    requestFn: () => Promise<T>
  ): Promise<T> {
    // Check if we have a cached request
    if (this.requestCache.has(key)) {
      return this.requestCache.get(key) as Promise<T>;
    }

    // Create new request and cache it
    const request = requestFn().finally(() => {
      // Clear from cache after timeout
      setTimeout(() => {
        this.requestCache.delete(key);
      }, this.cacheTimeout);
    });

    this.requestCache.set(key, request);
    return request;
  }

 /**
 * Fetch latest articles with optional filtering
 */
static async fetchArticles(options: FetchArticlesOptions = {}) {
  const cacheKey = this.createCacheKey('fetchArticles', options);
  
  return this.getCachedRequest(cacheKey, async () => {
    const {
      limit = 20,
      offset = 0,
      categoryId,
      sortBy = 'published_at',
      sortOrder = 'desc',
      onlyTrending = false,
      onlyCritical = false
    } = options;

  try {
    let query;

    // Handle category filtering separately due to join requirements
    if (categoryId) {
      query = supabase
        .from('news_articles')
        .select(`
          id,
          title,
          summary,
          url,
          source,
          image_url,
          published_at,
          trending_score,
          is_critical,
          created_at,
          article_categories!inner(category_id)
        `)
        .eq('article_categories.category_id', categoryId);
    } else {
      query = supabase
        .from('news_articles')
        .select(`
          id,
          title,
          summary,
          url,
          source,
          image_url,
          published_at,
          trending_score,
          is_critical,
          created_at
        `);
    }

    // Apply other filters
    if (onlyTrending) {
      query = query.gt('trending_score', 0);
    }

    if (onlyCritical) {
      query = query.eq('is_critical', true);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return { articles: [], error, count: 0 };
    }

    return { articles: data as Article[], error: null, count: count || 0 };
  } catch (err) {
    return { articles: [], error: err as Error, count: 0 };
  }
  });
}

  /**
   * Fetch articles based on user preferences
   */
  static async fetchUserFeedArticles(userId: string, options: Omit<FetchArticlesOptions, 'userId'> = {}) {
    const cacheKey = this.createCacheKey('fetchUserFeedArticles', { userId, ...options });
    
    return this.getCachedRequest(cacheKey, async () => {
      try {
        // First, get user preferences
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('preferences')
          .eq('id', userId)
          .single();

        if (profileError || !profile?.preferences) {
          return { articles: [], error: null, count: 0 };
        }

        let categoryIds: string[] = [];
        
        // Parse preferences - handle both old single category and new multiple categories format
        if (typeof profile.preferences === 'string') {
          categoryIds = [profile.preferences];
        } else if (typeof profile.preferences === 'object' && profile.preferences.categoryIds) {
          categoryIds = profile.preferences.categoryIds;
        } else {
          return { articles: [], error: null, count: 0 };
        }

        if (categoryIds.length === 0) {
          return { articles: [], error: null, count: 0 };
        }

        // Fetch articles from user's selected categories
        return this.fetchArticlesByCategories(categoryIds, options);
      } catch (err) {
        return { articles: [], error: err as Error, count: 0 };
      }
    });
  }

  /**
   * Fetch articles from multiple categories
   */
  static async fetchArticlesByCategories(categoryIds: string[], options: FetchArticlesOptions = {}) {
    const {
      limit = 20,
      offset = 0,
      sortBy = 'published_at',
      sortOrder = 'desc',
      onlyTrending = false,
      onlyCritical = false
    } = options;

    try {
      let query = supabase
        .from('news_articles')
        .select(`
          id,
          title,
          summary,
          url,
          source,
          image_url,
          published_at,
          trending_score,
          is_critical,
          created_at,
          article_categories!inner(category_id)
        `)
        .in('article_categories.category_id', categoryIds);

      // Apply other filters
      if (onlyTrending) {
        query = query.gt('trending_score', 0);
      }

      if (onlyCritical) {
        query = query.eq('is_critical', true);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        return { articles: [], error, count: 0 };
      }

      return { articles: data as Article[], error: null, count: count || 0 };
    } catch (err) {
      return { articles: [], error: err as Error, count: 0 };
    }
  }

  /**
   * Fetch trending articles
   */
  static async fetchTrendingArticles(limit: number = 10) {
    return this.fetchArticles({
      limit,
      sortBy: 'trending_score',
      sortOrder: 'desc',
      onlyTrending: true
    });
  }

  /**
   * Fetch critical/breaking news articles
   */
  static async fetchCriticalArticles(limit: number = 5) {
    return this.fetchArticles({
      limit,
      sortBy: 'published_at',
      sortOrder: 'desc',
      onlyCritical: true
    });
  }



  /**
   * Fetch a single article by ID
   */
  static async fetchArticleById(articleId: string) {
    try {
      const { data, error } = await supabase
        .from('news_articles')
        .select(`
          id,
          title,
          summary,
          url,
          source,
          image_url,
          published_at,
          trending_score,
          is_critical,
          created_at,
          article_categories(
            categories(
              id,
              name
            )
          )
        `)
        .eq('id', articleId)
        .single();

      if (error) {
        return { article: null, error };
      }

      return { article: data as Article, error: null };
    } catch (err) {
      return { article: null, error: err as Error };
    }
  }

  /**
   * Fetch all categories
   */
  static async fetchCategories() {
    const cacheKey = this.createCacheKey('fetchCategories', {});
    
    return this.getCachedRequest(cacheKey, async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name')
          .order('name');

        if (error) {
          return { categories: [], error };
        }

        return { categories: data as Category[], error: null };
      } catch (err) {
        return { categories: [], error: err as Error };
      }
    });
  }

  /**
   * Search articles by title or summary
   */
  static async searchArticles(searchTerm: string, options: FetchArticlesOptions = {}) {
    const { limit = 20, offset = 0 } = options;

    try {
      const { data, error } = await supabase
        .from('news_articles')
        .select(`
          id,
          title,
          summary,
          url,
          source,
          image_url,
          published_at,
          trending_score,
          is_critical,
          created_at
        `)
        .or(`title.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%`)
        .order('published_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return { articles: [], error };
      }

      return { articles: data as Article[], error: null };
    } catch (err) {
      return { articles: [], error: err as Error };
    }
  }
}