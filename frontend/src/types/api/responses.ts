/**
 * Standardized API response envelopes for article and taxonomy queries.
 */
import type { Article } from "../articles";
import type { Category } from "../categories";

export type ArticlesResponse = {
  articles: Article[];
  error: Error | null;
  count?: number;
};

export type ArticleResponse = {
  article: Article | null;
  error: Error | null;
};

export type CategoriesResponse = {
  categories: Category[];
  error: Error | null;
};
