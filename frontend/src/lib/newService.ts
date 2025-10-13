import { supabase } from './supabase';
import { Article, Category, UserPreferences } from '@/types';

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

 /**
 * Fetch latest articles with optional filtering
 */
static async fetchArticles(options: FetchArticlesOptions = {}) {
  const {
    limit = 20,
    offset = 0,
    categoryId,
    userId,
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
      console.error('Error fetching articles:', error);
      return { articles: [], error, count: 0 };
    }

    return { articles: data as Article[], error: null, count: count || 0 };
  } catch (err) {
    console.error('Unexpected error in fetchArticles:', err);
    return { articles: [], error: err as Error, count: 0 };
  }
}

  /**
   * Fetch articles based on user preferences
   */
  static async fetchUserFeedArticles(userId: string, options: Omit<FetchArticlesOptions, 'userId'> = {}) {
    try {
      // First, get user preferences
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', userId)
        .single();

      if (profileError || !profile?.preferences) {
        // If no preferences, return general articles
        return this.fetchArticles(options);
      }

      // Fetch articles based on user's preferred category
      return this.fetchArticles({
        ...options,
        categoryId: profile.preferences,
        userId
      });
    } catch (err) {
      console.error('Error fetching user feed:', err);
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
        console.error('Error fetching article:', error);
        return { article: null, error };
      }

      return { article: data as Article, error: null };
    } catch (err) {
      console.error('Unexpected error in fetchArticleById:', err);
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
        console.error('Error fetching categories:', error);
        return { categories: [], error };
      }

      return { categories: data as Category[], error: null };
    } catch (err) {
      console.error('Unexpected error in fetchCategories:', err);
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
          created_at
        `)
        .or(`title.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%`)
        .order('published_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error searching articles:', error);
        return { articles: [], error };
      }

      return { articles: data as Article[], error: null };
    } catch (err) {
      console.error('Unexpected error in searchArticles:', err);
      return { articles: [], error: err as Error };
    }
  }
}