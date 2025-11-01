import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Article } from "@/types";

type TrendingCacheRow = {
  rank: number;
  article_id: string;
};

async function createSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
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
            /* ignore cookie mutation warnings */
          }
        },
      },
    }
  );
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.max(1, Math.min(parseInt(searchParams.get("limit") || "20", 10), 50));
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));

    const {
      data: cacheRows,
      error: cacheError,
      count,
    } = await supabase
      .from("trending_articles_cache")
      .select("rank, article_id", { count: "exact" })
      .order("rank", { ascending: true })
      .range(offset, offset + limit - 1);

    if (cacheError) {
      return NextResponse.json(
        { error: "Failed to load trending cache" },
        { status: 500 }
      );
    }

    const articleIds = ((cacheRows ?? []) as TrendingCacheRow[]).map(
      (row) => row.article_id
    );
    let articles: Article[] = [];

    if (articleIds.length > 0) {
      const {
        data: articleData,
        error: articlesError,
      } = await supabase
        .from("news_articles")
        .select(
          "id, title, summary, url, source, image_url, published_at, trending_score, is_critical, created_at, keywords"
        )
        .in("id", articleIds);

      if (articlesError) {
        return NextResponse.json(
          { error: "Failed to load articles" },
          { status: 500 }
        );
      }

      const articleMap = new Map(
        (articleData ?? []).map((item) => [item.id, item as Article])
      );

      articles = articleIds
        .map((id) => articleMap.get(id))
        .filter((item): item is Article => Boolean(item));
    }

    const total = count ?? 0;
    const hasMore = offset + articles.length < total;

    return NextResponse.json({
      articles,
      pagination: {
        limit,
        offset,
        total,
        hasMore,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
