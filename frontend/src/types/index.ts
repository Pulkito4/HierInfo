// src/types/index.ts

export type Article = {
  id: string;
  title: string;
  summary?: string | null;
  url: string;
  source: string;
  image_url?: string | null;
  published_at: string; // ISO date string
  trending_score?: number;
  is_critical?: boolean;
  created_at: string; // ISO date string
  categories?: Category[]; // For when we join with categories
};

export type Category = {
  id: string;
  name: string;
};

export type Profile = {
  id: string;
  username: string;
  preferences?: UserPreferencesData | string | null; // Can be object, string, or null
  created_at: string;
};

export type UserPreferencesData = {
  categoryIds: string[];
  updatedAt: string;
};

export type UserPreferences = {
  categoryId: string | null;
  categoryIds?: string[];
  notificationsEnabled?: boolean;
  // Add more preference fields as needed
};

export type ArticleCategory = {
  article_id: string;
  category_id: string;
};

// API Response types
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

// UI State types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type ArticleFilters = {
  categoryId?: string;
  onlyTrending?: boolean;
  onlyCritical?: boolean;
  searchTerm?: string;
};

// Pagination types
export type PaginationState = {
  page: number;
  limit: number;
  total: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};