import { QueryClient } from "@tanstack/react-query";
import { QUERY_DEFAULT_GC_TIME_MS, QUERY_DEFAULT_STALE_TIME_MS } from "@/lib/constants";

/**
 * Shared QueryClient instance configured with sensible defaults for caching and refetching.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_DEFAULT_STALE_TIME_MS,
      gcTime: QUERY_DEFAULT_GC_TIME_MS,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});
