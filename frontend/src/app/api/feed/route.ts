import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { Article } from '@/types/articles';
import { getDayBoundaries, parseCategoryPreferences } from '@/utils';

const DEFAULT_LIMIT = 20;
const CANDIDATE_MULTIPLIER = 3;

type ServerSupabaseClient = ReturnType<typeof createServerClient>;

async function resolveUser(
  request: NextRequest,
  supabase: ServerSupabaseClient
) {
  const authorization = request.headers.get('authorization');
  const bearerToken = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : null;

  if (bearerToken) {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL!}/auth/v1/user`,
        {
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${bearerToken}`,
          },
          cache: 'no-store',
        }
      );

      if (response.ok) {
        const data = (await response.json()) as User;
        if (data?.id) {
          return { user: data, error: null, accessToken: bearerToken } as const;
        }
      }
    } catch {
      // Ignore bearer resolution failures and fall back to cookie-based lookup.
    }
  }

  const { data, error } = await supabase.auth.getUser();
  return { user: data.user, error, accessToken: null } as const;
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

  const { user, error: authError, accessToken } = await resolveUser(request, supabase);

    if (authError && authError.message && authError.message !== 'Auth session missing') {
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

    const databaseClient: SupabaseClient = accessToken
      ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        })
      : (supabase as unknown as SupabaseClient);

    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') || '', 10);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : DEFAULT_LIMIT;

    const { data: profile, error: profileError } = await databaseClient
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
      databaseClient
        .from('trending_articles_cache')
        .select('article_id, rank')
        .order('rank', { ascending: true })
        .limit(10),
      databaseClient
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

    const { data: categoryLinks, error: categoryLinkError } = await databaseClient
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

    const { data: candidateRows, error: candidateError } = await databaseClient
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

    const windowUsed: 'all' = 'all';
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