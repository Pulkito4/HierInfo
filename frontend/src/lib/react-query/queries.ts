import { supabase } from "@/lib/supabase";
import type { Article } from "@/types/articles";
import type { TrendingPage, CriticalPage, ForYouResponse, ExplorePage } from "@/types/api";
import { EXPLORE_KEY_ROOT, FEED_KEY_ROOT } from "@/lib/constants";

/**
 * Centralized React Query keys used across feeds.
 * - Keep keys stable/minimal; include params only when they change the result set.
 * - Trending/Critical include `{limit}` to isolate page sizes; Explore includes a session `seed`.
 */
export const feedQueryKeys = {
  forYou: (userId: string) => [FEED_KEY_ROOT, "forYou", userId] as const,
  trending: (limit: number) => [FEED_KEY_ROOT, "trending", { limit }] as const,
  critical: (limit: number) => [FEED_KEY_ROOT, "critical", { limit }] as const,
  explore: (userId: string | "anon", seed: string, limit: number) => [
    EXPLORE_KEY_ROOT,
    userId,
    seed,
    { limit },
  ] as const,
};

/**
 * Fetch a single page of Trending articles from the API route.
 * @param limit Max number of articles to return.
 * @param offset Zero-based offset for pagination.
 * @returns A TrendingPage with articles and pagination info.
 */
export async function fetchTrendingPage({
  limit,
  offset,
}: {
  limit: number;
  offset: number;
}): Promise<TrendingPage> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

  const res = await fetch(`/api/feed/trending?${params.toString()}`, {
    method: "GET",
    headers,
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch a single page of Critical articles from the API route.
 * @param limit Max number of articles to return.
 * @param offset Zero-based offset for pagination.
 * @returns A CriticalPage with articles and pagination info.
 */
export async function fetchCriticalPage({
  limit,
  offset,
}: {
  limit: number;
  offset: number;
}): Promise<CriticalPage> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

  const res = await fetch(`/api/feed/critical?${params.toString()}`, {
    method: "GET",
    headers,
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch the personalized For You digest (requires auth).
 * @param userId Current user's id (used server-side for personalization).
 * @param limit Max number of articles to return.
 * @returns A ForYouResponse containing the digest and metadata.
 */
export async function fetchForYou({ userId, limit }: { userId: string; limit: number }): Promise<ForYouResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

  const params = new URLSearchParams({ limit: String(limit) });
  const res = await fetch(`/api/feed?${params.toString()}`, {
    method: "GET",
    headers,
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch a single Explore page using offset-based pagination and a session-stable seed.
 * @param limit Max number of articles to return.
 * @param offset Zero-based offset for pagination.
 * @param seed Session-stable value for deterministic ordering.
 * @returns An ExplorePage with articles and pagination info.
 */
export async function fetchExplorePage({
  limit,
  offset,
  seed,
}: {
  limit: number;
  offset: number;
  seed: string;
}): Promise<ExplorePage> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset), seed });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

  const res = await fetch(`/api/explore?${params.toString()}`, {
    method: "GET",
    headers,
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({} as Record<string, unknown>));
    throw new Error((err as { error?: string }).error || `HTTP ${res.status}`);
  }
  return res.json();
}
