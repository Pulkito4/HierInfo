"use client";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { useAuth } from "@/lib/authContext";
import type { Article } from "@/types/articles";
import { feedQueryKeys, fetchTrendingPage, fetchCriticalPage, fetchForYou, fetchExplorePage } from "./queries";
import type { TrendingPage, ExplorePage } from "@/types/api";
import {
  DIGEST_GC_TIME,
  DIGEST_STALE_TIME,
  EXPLORE_STALE_TIME_MS,
  TRENDING_PAGE_SIZE_DEFAULT,
  CRITICAL_PAGE_SIZE_DEFAULT,
  FOR_YOU_PAGE_SIZE_DEFAULT,
  EXPLORE_PAGE_SIZE_DEFAULT,
} from "@/lib/constants";

/**
 * useTrendingFeed
 * Infinite paginated hook for Trending using React Query.
 * - Caches indefinitely and updates via push invalidation (cache_versions).
 * @param limit Max articles per page.
 * @returns Object with {articles, hasMore, loading, error, fetchMore, refetch}.
 */
export function useTrendingFeed(limit: number = TRENDING_PAGE_SIZE_DEFAULT) {
  const query = useInfiniteQuery<TrendingPage, Error>({
    queryKey: feedQueryKeys.trending(limit),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastOffset) => {
      // const total = lastPage.pagination?.total ?? lastPage.articles.length;
      const pageOffset = typeof lastOffset === "number" ? lastOffset : 0;
      const hasMore = Boolean(lastPage.pagination?.hasMore);
      return hasMore ? pageOffset + limit : undefined;
    },
    queryFn: ({ pageParam }) =>
      fetchTrendingPage({ limit, offset: typeof pageParam === "number" ? pageParam : 0 }),
    staleTime: DIGEST_STALE_TIME,
    gcTime: DIGEST_GC_TIME,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const articles = (query.data?.pages ?? []).flatMap((p) => p.articles ?? []);
  const hasMore = Boolean(query.data?.pages.at(-1)?.pagination?.hasMore);

  return {
    articles,
    hasMore,
    loading: query.status === "pending" ? "loading" : query.status === "error" ? "error" : "success",
    error: query.error ?? null,
    fetchMore: () => query.fetchNextPage(),
    refetch: () => query.refetch(),
  } as const;
}

/**
 * useForYouFeed
 * Single-page personalized digest for the current user.
 * - Caches indefinitely; invalidated on daily_digest and profile updates.
 * @param limit Max articles to fetch.
 * @returns Object with {articles, count, message, metadata, loading, error, refetch}.
 */
export function useForYouFeed(limit: number = FOR_YOU_PAGE_SIZE_DEFAULT) {
  const { user } = useAuth();
  const userId = user?.id;

  const query = useQuery<{ articles: Article[]; count: number; message?: string; metadata?: Record<string, unknown> }, Error>({
    queryKey: userId ? feedQueryKeys.forYou(userId) : ["feeds", "forYou", "anon"],
    queryFn: () => {
      if (!userId) throw new Error("Not authenticated");
      return fetchForYou({ userId, limit });
    },
    enabled: Boolean(userId),
    staleTime: DIGEST_STALE_TIME,
    gcTime: DIGEST_GC_TIME,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return {
    articles: query.data?.articles ?? [],
    count: query.data?.count ?? 0,
    message: query.data?.message,
    metadata: query.data?.metadata,
    loading: query.status === "pending" ? "loading" : query.status === "error" ? "error" : "success",
    error: query.error ?? null,
    refetch: () => query.refetch(),
  } as const;
}

/**
 * useCriticalFeed
 * Infinite paginated hook for Critical updates.
 * - Caches indefinitely; invalidated when cache_versions.critical is bumped.
 * @param limit Max articles per page.
 * @returns Object with {articles, hasMore, loading, error, fetchMore, refetch}.
 */
export function useCriticalFeed(limit: number = CRITICAL_PAGE_SIZE_DEFAULT) {
  const query = useInfiniteQuery<TrendingPage, Error>({
    queryKey: feedQueryKeys.critical(limit),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastOffset) => {
      const _total = lastPage.pagination?.total ?? lastPage.articles.length;
      const pageOffset = typeof lastOffset === "number" ? lastOffset : 0;
      const hasMore = Boolean(lastPage.pagination?.hasMore);
      return hasMore ? pageOffset + limit : undefined;
    },
    queryFn: ({ pageParam }) =>
      fetchCriticalPage({ limit, offset: typeof pageParam === "number" ? pageParam : 0 }),
    staleTime: DIGEST_STALE_TIME,
    gcTime: DIGEST_GC_TIME,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const articles = (query.data?.pages ?? []).flatMap((p) => p.articles ?? []);
  const hasMore = Boolean(query.data?.pages.at(-1)?.pagination?.hasMore);

  return {
    articles,
    hasMore,
    loading: query.status === "pending" ? "loading" : query.status === "error" ? "error" : "success",
    error: query.error ?? null,
    fetchMore: () => query.fetchNextPage(),
    refetch: () => query.refetch(),
  } as const;
}

/**
 * useExploreFeed
 * Infinite paginated Explore hook with session-stable ordering.
 * - Uses a per-session seed to avoid duplicates and keep order stable.
 * - Server returns a 70/30 curated/discovery mix and excludes interacted items.
 * @param limit Max articles per page.
 * @returns Object with {articles, hasMore, loading, error, fetchMore, refetch}.
 */
export function useExploreFeed(limit: number = EXPLORE_PAGE_SIZE_DEFAULT) {
  const { user } = useAuth();
  // Session-stable seed for deterministic ordering without duplicates
  const seedRef = useRef<string>(`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`);
  const seed = seedRef.current;

  const query = useInfiniteQuery<ExplorePage, Error>({
    queryKey: feedQueryKeys.explore(user?.id ?? "anon", seed, limit),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.pagination?.hasMore ? lastPage.pagination?.nextOffset ?? null : undefined),
    queryFn: ({ pageParam }) =>
      fetchExplorePage({ limit, offset: typeof pageParam === "number" ? pageParam : 0, seed }),
    staleTime: EXPLORE_STALE_TIME_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  // Flatten and de-duplicate across pages as a guard
  const seen = new Set<string>();
  const articles = (query.data?.pages ?? []).flatMap((p) => (p.articles ?? []).filter((a) => {
    const id = (a as { id?: string }).id;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  }));

  const hasMore = Boolean(query.data?.pages.at(-1)?.pagination?.hasMore);

  return {
    articles,
    hasMore,
    loading: query.status === "pending" ? "loading" : query.status === "error" ? "error" : "success",
    error: query.error ?? null,
    fetchMore: () => query.fetchNextPage(),
    refetch: () => query.refetch(),
  } as const;
}
