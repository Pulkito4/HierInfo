import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Article } from "@/types";

type CriticalCacheRow = {
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
    const limit = Math.max(1, Math.min(parseInt(searchParams.get("limit") || "10", 10), 50));
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
