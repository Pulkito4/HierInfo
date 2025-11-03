/**
 * Generic pagination shape for cursor-less list views.
 */
export type PaginationState = {
  page: number;
  limit: number;
  total: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};
