import { NextRequest, NextResponse } from 'next/server';
import { createRouteSupabaseClient } from '@/lib/server/auth';
import type { Article } from '@/types/articles';
import { EXPLORE_PAGE_SIZE_DEFAULT, EXPLORE_CANDIDATE_MULTIPLIER, EXPLORE_MAX_CANDIDATE_POOL, EXPLORE_CURATED_RATIO } from '@/lib/constants';

// Deterministic hash for stable pseudo-random ordering across pages
function hashStringToNumber(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) + input.charCodeAt(i);
    hash |= 0; // force int32
  }
  return Math.abs(hash);
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteSupabaseClient(request);
    const { data: userData, error: authError } = await supabase.auth.getUser();
    const user = userData?.user ?? null;

    if (authError && authError.message && authError.message !== 'Auth session missing' && !user) {
      return NextResponse.json(
        { error: 'Authentication failed', details: authError.message },
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
    const offsetParam = parseInt(searchParams.get('offset') || '', 10);
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : EXPLORE_PAGE_SIZE_DEFAULT;
  const offset = Number.isFinite(offsetParam) && offsetParam >= 0 ? offsetParam : 0;
  const seedParam = searchParams.get('seed') || '';
  const seed = seedParam || user.id || 'default-seed';

    // Grow candidate pool with offset so deeper pages have enough items available.
    // If the pool is too small to satisfy the requested page (after exclusions),
    // increase the pool up to a cap and retry a limited number of times.
    const maxAttempts = 2; // avoid excessive RPC calls per request
    let attempt = 0;
    let candidateLimit = Math.min(
      EXPLORE_MAX_CANDIDATE_POOL,
      Math.max((offset + 1) * limit * EXPLORE_CANDIDATE_MULTIPLIER, limit)
    );

    let merged: Article[] = [];
    const seen = new Set<string>();

    const loadCandidates = async (limitForAttempt: number) => {
      const curatedPoolSize = Math.ceil(limitForAttempt * EXPLORE_CURATED_RATIO);
      const discoveryPoolSize = Math.max(limitForAttempt - curatedPoolSize, 0);

      let curated: Article[] = [];
      let discovery: Article[] = [];

      try {
        const { data: similarData } = await supabase.rpc('get_similar_articles', {
          p_user_id: user.id,
          result_limit: curatedPoolSize,
        });
        if (Array.isArray(similarData)) curated = similarData as Article[];
      } catch {}

      try {
        const { data: discoveryData } = await supabase.rpc('get_discovery_articles', {
          p_user_id: user.id,
          result_limit: discoveryPoolSize,
        });
        if (Array.isArray(discoveryData)) discovery = discoveryData as Article[];
      } catch {}

      // Merge & de-duplicate into the running pool
      for (const a of [...curated, ...discovery]) {
        const id = (a as { id?: string }).id;
        if (!id || seen.has(id)) continue;
        seen.add(id);
        merged.push(a);
      }
    };

    // Initial load
    await loadCandidates(candidateLimit);
    // If we still can't fill up to the current page window, try to expand the pool.
    while (attempt < maxAttempts && merged.length < offset + Math.min(limit, 10) && candidateLimit < EXPLORE_MAX_CANDIDATE_POOL) {
      attempt += 1;
      candidateLimit = Math.min(EXPLORE_MAX_CANDIDATE_POOL, Math.ceil(candidateLimit * 1.8));
      await loadCandidates(candidateLimit);
    }

    // Stable pseudo-random order for session: sort by hash(id + seed), then by trending_score/published_at
    merged.sort((a, b) => {
      const idA = (a as { id: string }).id;
      const idB = (b as { id: string }).id;
      const hA = hashStringToNumber(`${idA}:${seed}`);
      const hB = hashStringToNumber(`${idB}:${seed}`);
      if (hA !== hB) return hA - hB;
      const tsA = (a as { trending_score?: number }).trending_score ?? 0;
      const tsB = (b as { trending_score?: number }).trending_score ?? 0;
      if (tsA !== tsB) return tsB - tsA;
      const paA = new Date((a as { published_at?: string }).published_at || 0).getTime();
      const paB = new Date((b as { published_at?: string }).published_at || 0).getTime();
      return paB - paA;
    });

    // Paginate the shuffled list
    const paged = merged.slice(offset, offset + limit);
  const hasMore = offset + paged.length < merged.length || candidateLimit < EXPLORE_MAX_CANDIDATE_POOL;
  const nextOffset = hasMore ? offset + limit : null;

    return NextResponse.json({
      articles: paged,
      pagination: {
        limit,
        offset,
        total: merged.length,
        hasMore,
        nextOffset,
      },
      metadata: {
        curatedPoolSize: Math.ceil(candidateLimit * EXPLORE_CURATED_RATIO),
        discoveryPoolSize: Math.max(candidateLimit - Math.ceil(candidateLimit * EXPLORE_CURATED_RATIO), 0),
        poolCombined: merged.length,
        seed,
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
