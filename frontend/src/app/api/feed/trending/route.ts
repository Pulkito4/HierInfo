import { NextRequest, NextResponse } from "next/server";
import { createRouteSupabaseClient } from "@/lib/server/auth";
import type { TrendingCacheRow } from "@/types/api";
import type { Article } from "@/types/articles";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteSupabaseClient(request);

    const { searchParams } = new URL(request.url);
    const limit = Math.max(1, Math.min(parseInt(searchParams.get("limit") || "10", 10), 10));
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
  let source: 'cache' | 'fallback' = 'cache';
  let missingIds: string[] = [];

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

  missingIds = articleIds.filter((id) => !articleMap.has(id));
      if (missingIds.length > 0) {
        source = 'fallback';
      }

      if (articles.length === 0) {
        const { data: fallbackArticles, error: fallbackError } = await supabase
          .from("news_articles")
          .select(
            "id, title, summary, url, source, image_url, published_at, trending_score, is_critical, created_at, keywords"
          )
          .order("trending_score", { ascending: false })
          .order("published_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (fallbackError) {
          return NextResponse.json(
            { error: "Failed to load trending fallback" },
            { status: 500 }
          );
        }

        articles = (fallbackArticles ?? []) as Article[];
        source = 'fallback';

        return NextResponse.json({
          articles,
          pagination: {
            limit,
            offset,
            total: fallbackArticles?.length ?? 0,
            hasMore: false,
          },
          metadata: {
            source,
            cacheSize: articleIds.length,
            missingIds,
          },
        });
      }
    }

    if (articleIds.length === 0) {
      const { data: fallbackArticles, error: fallbackError } = await supabase
        .from("news_articles")
        .select(
          "id, title, summary, url, source, image_url, published_at, trending_score, is_critical, created_at, keywords"
        )
        .order("trending_score", { ascending: false })
        .order("published_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (fallbackError) {
        return NextResponse.json(
          { error: "Failed to load trending fallback" },
          { status: 500 }
        );
      }

      articles = (fallbackArticles ?? []) as Article[];
      source = 'fallback';
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
      metadata: {
        source,
        cacheSize: articleIds.length,
        missingIds,
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
