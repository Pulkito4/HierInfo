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
