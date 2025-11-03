import { NewsService } from "@/lib/newService";
import type { Article } from "@/types/articles";

export const articleQueryKeys = {
  personalDigest: () => ["articles", "personal"] as const,
  trending: (limit: number) => ["articles", "trending", { limit }] as const,
  critical: (limit: number) => ["articles", "critical", { limit }] as const,
};

/**
 * Fetch helper for trending feed queries when wiring into components.
 */
export async function fetchTrendingArticles(limit: number): Promise<Article[]> {
  const { articles } = await NewsService.fetchTrendingArticles({ limit });
  return articles;
}

/**
 * Fetch helper for critical feed queries when wiring into components.
 */
export async function fetchCriticalArticles(limit: number): Promise<Article[]> {
  const { articles } = await NewsService.fetchCriticalArticles({ limit });
  return articles;
}
