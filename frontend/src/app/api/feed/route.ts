import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Article } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Debug: Log available cookies
    const allCookies = cookieStore.getAll();
    console.log('Feed API - Available cookies:', allCookies.map(c => ({ name: c.name, hasValue: !!c.value })));
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    // Get authenticated user
    console.log('Feed API - Attempting to get user...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('Feed API - Auth result:', { 
      hasUser: !!user, 
      userId: user?.id,
      authError: authError?.message 
    });
    
    if (authError) {
      console.error('Feed API auth error:', authError);
      return NextResponse.json({ 
        error: 'Authentication failed', 
        details: authError.message 
      }, { status: 401 });
    }
    
    if (!user) {
      console.error('Feed API: No user found in session');
      return NextResponse.json({ 
        error: 'No authenticated user found' 
      }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'published_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const onlyTrending = searchParams.get('onlyTrending') === 'true';
    const onlyCritical = searchParams.get('onlyCritical') === 'true';

    // First, get user preferences
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json({ 
        error: 'Failed to fetch user profile',
        details: profileError.message 
      }, { status: 500 });
    }

    if (!profile?.preferences) {
      return NextResponse.json({ 
        articles: [], 
        count: 0,
        message: 'No user preferences found. Please set up your categories first.'
      });
    }

    // Parse user preferences
    let categoryIds: string[] = [];
    if (typeof profile.preferences === 'string') {
      categoryIds = [profile.preferences];
    } else if (typeof profile.preferences === 'object' && profile.preferences.categoryIds) {
      categoryIds = profile.preferences.categoryIds;
    }

    if (categoryIds.length === 0) {
      return NextResponse.json({ 
        articles: [], 
        count: 0,
        message: 'No categories selected in preferences'
      });
    }

    // Fetch articles with efficient single query using array contains
    let articlesQuery = supabase
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
      `, { count: 'exact' })
      .in('article_categories.category_id', categoryIds);

    // Apply filters
    if (onlyTrending) {
      articlesQuery = articlesQuery.gt('trending_score', 0.7);
    }
    
    if (onlyCritical) {
      articlesQuery = articlesQuery.eq('is_critical', true);
    }

    // Apply sorting and pagination
    articlesQuery = articlesQuery
      .order(sortBy as 'created_at' | 'published_at' | 'trending_score', { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    const { data: articles, error: articlesError, count } = await articlesQuery;

    if (articlesError) {
      console.error('Articles fetch error:', articlesError);
      return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
    }

    // Deduplicate articles (in case an article belongs to multiple user-selected categories)
    const uniqueArticles = articles?.reduce((acc: Article[], article: Article) => {
      if (!acc.find(a => a.id === article.id)) {
        acc.push(article);
      }
      return acc;
    }, [] as Article[]) || [];

    return NextResponse.json({
      articles: uniqueArticles,
      count: count || 0,
      pagination: {
        limit,
        offset,
        hasMore: (offset + limit) < (count || 0)
      }
    });

  } catch (error) {
    console.error('Feed API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}