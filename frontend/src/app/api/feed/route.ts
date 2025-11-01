import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Article } from '@/types';

const DEFAULT_LIMIT = 20;
const CANDIDATE_MULTIPLIER = 3;

function parseCategoryPreferences(preferences: unknown): string[] {
  if (!preferences) return [];

  if (typeof preferences === 'string') {
    return preferences ? [preferences] : [];
  }

  if (Array.isArray(preferences)) {
    return preferences.filter((value): value is string => typeof value === 'string' && value.length > 0);
  }

  if (typeof preferences === 'object' && preferences !== null) {
    const maybeCategoryIds = (preferences as { categoryIds?: unknown }).categoryIds;
    if (Array.isArray(maybeCategoryIds)) {
      return maybeCategoryIds.filter((value): value is string => typeof value === 'string' && value.length > 0);
    }
  }

  return [];
}

function getDayBoundaries() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              /* ignore SSR cookie warnings */
            }
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') || '', 10);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : DEFAULT_LIMIT;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        {
          error: 'Failed to fetch user profile',
          details: profileError.message,
        },
        { status: 500 }
      );
    }

    const categoryIds = parseCategoryPreferences(profile?.preferences);

    if (categoryIds.length === 0) {
      return NextResponse.json({
        articles: [],
        count: 0,
        message: 'No categories selected. Please update your preferences to receive a personalized digest.',
      });
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
    const candidateLimit = limit * CANDIDATE_MULTIPLIER;

    const { data: candidates, error: candidateError } = await supabase
      .from('news_articles')
      .select(
        'id, title, summary, url, source, image_url, published_at, trending_score, is_critical, created_at, keywords, article_categories!inner(category_id)'
      )
      .in('article_categories.category_id', categoryIds)
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString())
      .order('trending_score', { ascending: false })
      .order('published_at', { ascending: false })
      .range(0, Math.max(candidateLimit - 1, 0));

    if (candidateError) {
      return NextResponse.json(
        { error: 'Failed to load personalized articles' },
        { status: 500 }
      );
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
      const { article_categories, ...rest } = candidate as Record<string, unknown>;
      articles.push(rest as Article);

      if (articles.length >= limit) {
        break;
      }
    }

    const message = articles.length === 0
      ? 'No personalized articles available for today. Check back later or update your preferences.'
      : undefined;

    return NextResponse.json({
      articles,
      count: articles.length,
      message,
      metadata: {
        generatedAt: new Date().toISOString(),
        excludedCount: excludedIds.size,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}