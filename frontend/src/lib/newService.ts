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

 
 //Fetch latest articles with optional filtering

static async fetchArticles(options: FetchArticlesOptions = {}) {
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
          keywords,
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
          created_at,
          keywords
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
}

  /**
   * Fetch user's personalized feed articles - fallback to client-side approach
   */
  static async fetchUserFeedArticles(userId: string, options: Omit<FetchArticlesOptions, 'userId'> = {}) {
    try {
      // Build query parameters for API approach
      const params = new URLSearchParams({
        limit: options.limit?.toString() || '20',
        offset: options.offset?.toString() || '0',
        sortBy: options.sortBy || 'published_at',
        sortOrder: options.sortOrder || 'desc',
      });

      if (options.onlyTrending) {
        params.append('onlyTrending', 'true');
      }
      if (options.onlyCritical) {
        params.append('onlyCritical', 'true');
      }

      // Try API route first
      const response = await fetch(`/api/feed?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });

      // If API route fails with auth error, fallback to client-side approach
      if (response.status === 401) {
        console.log('Feed API auth failed, using fallback approach');
        return this.fetchUserFeedFallback(userId, options);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        articles: data.articles || [],
        count: data.count || 0,
        error: null,
      };

    } catch (err) {
      console.error('Error fetching user feed:', err);
      // If there's any error, try the fallback approach
      console.log('Feed API error, using fallback approach');
      return this.fetchUserFeedFallback(userId, options);
    }
  }

  /**
   * Fallback method using client-side Supabase calls
   */
  static async fetchUserFeedFallback(userId: string, options: Omit<FetchArticlesOptions, 'userId'> = {}) {
    try {
      // First, get user preferences using client-side Supabase
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

      // Fetch articles from user's selected categories using existing method
      return this.fetchArticlesByCategories(categoryIds, options);
    } catch (err) {
      console.error('Error in fallback feed fetch:', err);
      return { 
        articles: [], 
        error: err as Error, 
        count: 0 
      };
    }
  }  /**
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
          keywords,
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
          keywords,
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
          created_at,
          keywords
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