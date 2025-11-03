/**
 * Thin row descriptions for feed cache tables kept in Supabase.
 */
export type TrendingCacheRow = {
  rank: number;
  article_id: string;
};

export type CriticalCacheRow = {
  article_id: string;
};

/** Cache version bump notifications row. */
export type CacheVersionRow = {
  feed_name: string;
  version: number;
  updated_at?: string;
};
