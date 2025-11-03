/**
 * Supported article filter options used across feed surfaces.
 */
export type ArticleFilters = {
  categoryId?: string;
  onlyTrending?: boolean;
  onlyCritical?: boolean;
  searchTerm?: string;
};
