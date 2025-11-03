import { NextRequest, NextResponse } from "next/server";
import { createRouteSupabaseClient } from "@/lib/server/auth";
import { CRITICAL_API_MAX_LIMIT } from "@/lib/constants";
import type { CriticalCacheRow } from "@/types/api";
import type { Article } from "@/types/articles";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteSupabaseClient(request);

    const { searchParams } = new URL(request.url);
  const limit = Math.max(1, Math.min(parseInt(searchParams.get("limit") || String(CRITICAL_API_MAX_LIMIT), 10), CRITICAL_API_MAX_LIMIT));
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));

    const { data: cacheData, error: cacheError } = await supabase
      .from("critical_articles_cache")
      .select("article_id");

    if (cacheError) {
      return NextResponse.json(
        { error: "Failed to load critical cache" },
        { status: 500 }
      );
    }

    const articleIds = ((cacheData ?? []) as CriticalCacheRow[]).map(
      (row) => row.article_id
    );

    if (articleIds.length === 0) {
      return NextResponse.json({
        articles: [],
        pagination: {
          limit,
          offset,
          total: 0,
          hasMore: false,
        },
      });
    }

    const { data: articleData, error: articlesError } = await supabase
      .from("news_articles")
      .select(
        "id, title, summary, url, source, image_url, published_at, trending_score, is_critical, created_at, keywords"
      )
      .in("id", articleIds)
      .order("published_at", { ascending: false });

    if (articlesError) {
      return NextResponse.json(
        { error: "Failed to load articles" },
        { status: 500 }
      );
    }

    const sortedArticles = (articleData ?? []).map((item) => item as Article);
    const total = sortedArticles.length;
    const paginatedArticles = sortedArticles.slice(
      offset,
      offset + limit
    );
    const hasMore = offset + paginatedArticles.length < total;

    console.info('[critical] source=cache total=%d page=%d size=%d', total, offset, paginatedArticles.length);
    return NextResponse.json({
      articles: paginatedArticles,
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
