/**
 * Centralized app constants for feed keys, limits, timings, and realtime channels.
 * Keep these minimal and descriptive to avoid magic numbers/strings across the codebase.
 */

// Query key roots
export const FEED_KEY_ROOT = "feeds" as const;
export const EXPLORE_KEY_ROOT = "explore" as const;

// Feed names used by cache_versions (backend bump + realtime)
export const FEED_NAME_TRENDING = "trending" as const;
export const FEED_NAME_CRITICAL = "critical" as const;
export const FEED_NAME_DAILY_DIGEST = "daily_digest" as const;

// Realtime channel identifiers
export const REALTIME_CHANNEL_CACHE_VERSIONS = "db-cache_versions" as const;
export const REALTIME_CHANNEL_PROFILES = "db-profiles" as const;

// Default page sizes
export const TRENDING_PAGE_SIZE_DEFAULT = 10 as const;
export const CRITICAL_PAGE_SIZE_DEFAULT = 10 as const;
export const FOR_YOU_PAGE_SIZE_DEFAULT = 20 as const;
export const EXPLORE_PAGE_SIZE_DEFAULT = 20 as const;

// API constraints
export const TRENDING_API_MAX_LIMIT = 10 as const;
export const CRITICAL_API_MAX_LIMIT = 10 as const;

// Explore composition and pagination behavior
export const EXPLORE_CURATED_RATIO = 0.7; // 70% curated, 30% discovery
export const EXPLORE_CANDIDATE_MULTIPLIER = 3;
export const EXPLORE_MAX_CANDIDATE_POOL = 500;

// Caching timings
export const EXPLORE_STALE_TIME_MS = 10 * 60 * 1000; // 10 minutes
export const DIGEST_STALE_TIME = Infinity; // Trending/Critical/For You digests
export const DIGEST_GC_TIME = Infinity;

// React Query default timings (QueryClient)
export const QUERY_DEFAULT_STALE_TIME_MS = 5 * 60 * 1000; // 5 minutes
export const QUERY_DEFAULT_GC_TIME_MS = 30 * 60 * 1000; // 30 minutes

// UI skeleton defaults
export const SKELETON_ARTICLES_COUNT = 6 as const;
export const SKELETON_EXPLORE_COUNT = 8 as const;
export const CATEGORY_SKELETON_COUNT = 8 as const;
