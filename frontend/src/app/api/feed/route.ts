import { NextRequest, NextResponse } from 'next/server';
import type { Article } from '@/types/articles';
import { getDayBoundaries, parseCategoryPreferences } from '@/utils';
import { createRouteSupabaseClient } from '@/lib/server/auth';

const DEFAULT_LIMIT = 20;
const CANDIDATE_MULTIPLIER = 3;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteSupabaseClient(request);
    const { data: userData, error: authError } = await supabase.auth.getUser();
    const user = userData?.user ?? null;

    if (authError && authError.message && authError.message !== 'Auth session missing' && !user) {
      return NextResponse.json(
        {
          error: 'Authentication failed',
          details: authError.message,
        },
        { status: 401 }
      );
    }

    if (!user) {
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
      supabase
        .from('trending_articles_cache')
        .select('article_id, rank')
        .order('rank', { ascending: true })
        .limit(10),
      supabase
        .from('critical_articles_cache')
        .select('article_id')
        .limit(10),
    ]);

    const excludedIdsArray = [
      ...(((trendingCache ?? []) as { article_id: string }[]).map((row) => row.article_id)),
      ...(((criticalCache ?? []) as { article_id: string }[]).map((row) => row.article_id)),
    ];
    const excludedIds = new Set<string>(excludedIdsArray);
    const { start, end } = getDayBoundaries();
    // Temporarily show articles across all dates; re-enable day boundaries when daily digests return.
    const candidateLimit = limit * CANDIDATE_MULTIPLIER;

    const { data: categoryLinks, error: categoryLinkError } = await supabase
      .from('article_categories')
      .select('article_id')
      .in('category_id', categoryIds);

    if (categoryLinkError) {
      return NextResponse.json(
        {
          error: 'Failed to load personalized articles',
          details: categoryLinkError.message ?? categoryLinkError.code ?? 'Unknown error',
        },
        { status: 500 }
      );
    }

    const candidateArticleIds = Array.from(
      new Set(
        ((categoryLinks ?? []) as { article_id: string }[])
          .map((row) => row.article_id)
          .filter((articleId): articleId is string => Boolean(articleId))
      )
    ).filter((articleId) => !excludedIds.has(articleId));

    if (candidateArticleIds.length === 0) {
      return NextResponse.json({
        articles: [],
        count: 0,
        message: 'No personalized articles available for your categories yet. Check back later or update your preferences.',
        metadata: {
          generatedAt: new Date().toISOString(),
          excludedCount: excludedIds.size,
          window: 'all',
          windowBounds: {
            start: start.toISOString(),
            end: end.toISOString(),
            active: false,
          },
        },
      });
    }

    const fetchIdsForQuery = candidateArticleIds.slice(0, Math.max(candidateLimit * 2, limit));

    const { data: candidateRows, error: candidateError } = await supabase
      .from('news_articles')
      .select('id, title, summary, url, source, image_url, published_at, trending_score, is_critical, created_at, keywords')
      .in('id', fetchIdsForQuery)
      .order('trending_score', { ascending: false })
      .order('published_at', { ascending: false });

    if (candidateError) {
      return NextResponse.json(
        {
          error: 'Failed to load personalized articles',
          details: candidateError.message ?? candidateError.code ?? 'Unknown error',
        },
        { status: 500 }
      );
    }

    const windowUsed = 'all' as const;
    const candidates = candidateRows ?? [];

    const seen = new Set<string>();
    const articles: Article[] = [];

    for (const candidate of candidates ?? []) {
      const articleId = (candidate as { id: string }).id;
      if (!articleId) continue;
      if (excludedIds.has(articleId) || seen.has(articleId)) {
        continue;
      }

      seen.add(articleId);
      articles.push(candidate as Article);

      if (articles.length >= limit) {
        break;
      }
    }

    const message = articles.length === 0
      ? 'No personalized articles available for your categories yet. Check back later or update your preferences.'
      : undefined;

    return NextResponse.json({
      articles,
      count: articles.length,
      message,
      metadata: {
        generatedAt: new Date().toISOString(),
        excludedCount: excludedIds.size,
        window: windowUsed,
        windowBounds: {
          start: start.toISOString(),
          end: end.toISOString(),
          active: false,
        },
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