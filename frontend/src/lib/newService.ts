import { supabase } from './supabase';
import { getDayBoundaries, parseCategoryPreferences } from '@/utils';
import type { Article } from '@/types/articles';
import type { Category } from '@/types/categories';

export type FetchArticlesOptions = {
  limit?: number;
  offset?: number;
  categoryId?: string;
  userId?: string;
  sortBy?: 'created_at' | 'published_at' | 'trending_score';
  sortOrder?: 'asc' | 'desc';
  onlyTrending?: boolean;
  onlyCritical?: boolean;
};

export type FetchArticlesResult = {
  articles: Article[];
  error: Error | null;
  count: number;
  message?: string;
  pagination?: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
  metadata?: Record<string, unknown>;
};

const DEFAULT_FETCH_LIMIT = 20;

export class NewsService {

 
 //Fetch latest articles with optional filtering

static async fetchArticles(options: FetchArticlesOptions = {}): Promise<FetchArticlesResult> {
  const {
    limit = 20,
    offset = 0,
    categoryId,
    sortBy = 'published_at',
    sortOrder = 'desc',
    onlyTrending = false,
    onlyCritical = false
  } = options;

  if (!categoryId && onlyTrending && !onlyCritical) {
    return this.fetchTrendingArticles({ limit, offset });
  }

  if (!categoryId && onlyCritical) {
    return this.fetchCriticalArticles({ limit, offset });
  }

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
  static async fetchUserFeedArticles(userId: string, options: Omit<FetchArticlesOptions, 'userId'> = {}): Promise<FetchArticlesResult> {
    try {
      const limit = options.limit ?? DEFAULT_FETCH_LIMIT;
      const params = new URLSearchParams({ limit: String(Math.max(1, Math.min(limit, 50))) });

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: HeadersInit = { 'Content-Type': 'application/json' };

      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/feed?${params.toString()}`, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (response.status === 401) {
        console.log('Feed API auth failed, using fallback approach');
        return this.fetchUserFeedFallback(userId, options);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const articles = (data.articles ?? []) as Article[];
      const count = typeof data.count === 'number' ? data.count : articles.length;

      return {
        articles,
        count,
        error: null,
        message: data.message,
        metadata: data.metadata,
      };
    } catch (err) {
      console.error('Error fetching user feed:', err);
      console.log('Feed API error, using fallback approach');
      return this.fetchUserFeedFallback(userId, options);
    }
  }

  /**
   * Fallback method using client-side Supabase calls
   */
  static async fetchUserFeedFallback(userId: string, options: Omit<FetchArticlesOptions, 'userId'> = {}): Promise<FetchArticlesResult> {
    try {
      const limit = options.limit ?? DEFAULT_FETCH_LIMIT;
      const candidateLimit = limit * 3;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', userId)
        .single();

      if (profileError) {
        throw new Error(profileError.message);
      }

      const categoryIds = parseCategoryPreferences(profile?.preferences);

      if (categoryIds.length === 0) {
        return {
          articles: [],
          error: null,
          count: 0,
          message: 'No categories selected. Please update your preferences to receive a personalized digest.',
        };
      }

      const [{ data: trendingCache }, { data: criticalCache }] = await Promise.all([
        supabase.from('trending_articles_cache').select('article_id'),
        supabase.from('critical_articles_cache').select('article_id'),
      ]);

      const excludedIds = new Set<string>([
        ...(((trendingCache ?? []) as { article_id: string }[]).map((row) => row.article_id)),
        ...(((criticalCache ?? []) as { article_id: string }[]).map((row) => row.article_id)),
      ]);

      const { start, end } = getDayBoundaries();

      const { data: candidates, error: candidateError } = await supabase
        .from('news_articles')
        .select('id, title, summary, url, source, image_url, published_at, trending_score, is_critical, created_at, keywords, article_categories!inner(category_id)')
        .in('article_categories.category_id', categoryIds)
        .gte('created_at', start.toISOString())
        .lt('created_at', end.toISOString())
        .order('trending_score', { ascending: false })
        .order('published_at', { ascending: false })
        .range(0, Math.max(candidateLimit - 1, 0));

      if (candidateError) {
        throw new Error(candidateError.message);
      }

      const seen = new Set<string>();
      const articles: Article[] = [];

      for (const candidate of candidates ?? []) {
        const articleId = (candidate as { id: string }).id;
        if (!articleId) continue;
        if (excludedIds.has(articleId) || seen.has(articleId)) {
          continue;
        }

  seen.add(articleId);
  const { article_categories: articleCategoriesJoin, ...rest } = candidate as Record<string, unknown>;
  void articleCategoriesJoin;
  articles.push(rest as Article);

        if (articles.length >= limit) {
          break;
        }
      }

      const message = articles.length === 0
        ? 'No personalized articles available for today. Check back later or update your preferences.'
        : undefined;

      return {
        articles,
        error: null,
        count: articles.length,
        message,
      };
    } catch (err) {
      console.error('Error in fallback feed fetch:', err);
      return {
        articles: [],
        error: err as Error,
        count: 0,
      };
    }
  }  /**
   * Fetch articles from multiple categories
   */
  static async fetchArticlesByCategories(categoryIds: string[], options: FetchArticlesOptions = {}): Promise<FetchArticlesResult> {
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
  static async fetchTrendingArticles({ limit = DEFAULT_FETCH_LIMIT, offset = 0 }: { limit?: number; offset?: number } = {}): Promise<FetchArticlesResult> {
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset)
      });

      const response = await fetch(`/api/feed/trending?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Trending feed request failed with status ${response.status}`);
      }

      const data = await response.json();
      const articles = (data.articles ?? []) as Article[];
      const pagination = data.pagination as FetchArticlesResult['pagination'];
      const total = pagination?.total ?? articles.length;

      return {
        articles,
        pagination,
        count: typeof total === 'number' ? total : articles.length,
        error: null,
      };
    } catch (err) {
      return { articles: [], error: err as Error, count: 0 };
    }
  }

  /**
   * Fetch critical/breaking news articles
   */
  static async fetchCriticalArticles({ limit = DEFAULT_FETCH_LIMIT, offset = 0 }: { limit?: number; offset?: number } = {}): Promise<FetchArticlesResult> {
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset)
      });

      const response = await fetch(`/api/feed/critical?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Critical feed request failed with status ${response.status}`);
      }

      const data = await response.json();
      const articles = (data.articles ?? []) as Article[];
      const pagination = data.pagination as FetchArticlesResult['pagination'];
      const total = pagination?.total ?? articles.length;

      return {
        articles,
        pagination,
        count: typeof total === 'number' ? total : articles.length,
        error: null,
      };
    } catch (err) {
      return { articles: [], error: err as Error, count: 0 };
    }
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