/**
 * Feed contracts shared across fetchers and hooks.
 * Keep these minimal and reusable; prefer importing from here instead of inlining.
 */
import type { Article } from "../articles";

/** A single page of Trending articles with pagination. */
export type TrendingPage = {
  articles: Article[];
  pagination?: {
    limit: number;
    offset: number;
    total?: number;
    hasMore: boolean;
  };
};

/** Critical feed page; same shape as Trending. */
export type CriticalPage = TrendingPage;

/** For You digest response envelope. */
export type ForYouResponse = {
  articles: Article[];
  count: number;
  message?: string;
  metadata?: Record<string, unknown>;
};

/** Explore paginated response with optional next offset. */
export type ExplorePage = {
  articles: Article[];
  pagination?: {
    limit: number;
    offset: number;
    total?: number;
    hasMore: boolean;
    nextOffset?: number | null;
  };
  error?: string;
};
