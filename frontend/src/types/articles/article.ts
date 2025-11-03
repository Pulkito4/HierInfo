/**
 * Article metadata as stored in the news cache and rendered across tiles.
 */
import type { Category } from "../categories/category";

export type Article = {
  id: string;
  title: string;
  summary?: string | null;
  url: string;
  source: string;
  image_url?: string | null;
  published_at: string;
  trending_score?: number;
  is_critical?: boolean;
  created_at: string;
  keywords?: string[] | null;
  categories?: Category[];
};
