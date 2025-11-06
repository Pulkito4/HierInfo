import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Hook to check if an article is liked by the current user.
 * Uses React Query for caching to avoid repeated API calls.
 * 
 * @param articleId - The ID of the article to check
 * @param enabled - Whether the query should run (default: true)
 * @returns Query result with isLiked status, loading state, and refetch function
 */
export function useArticleLikeStatus(articleId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['article-like-status', articleId],
    queryFn: async () => {
      if (!articleId) return false;

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        return false;
      }

      const headers: HeadersInit = { "Content-Type": "application/json" };
      headers.Authorization = `Bearer ${session.access_token}`;

      const res = await fetch(`/api/user-activity/check?articleId=${articleId}&eventType=like`, {
        method: "GET",
        headers,
        credentials: "include",
      });

      if (!res.ok) {
        return false;
      }

      const data = await res.json();
      return data.exists || false;
    },
    enabled: enabled && !!articleId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}

/**
 * Helper function to invalidate like status cache for a specific article.
 * Call this after a like/unlike action to refresh the cached status.
 * 
 * @param queryClient - The React Query client instance
 * @param articleId - The ID of the article to invalidate
 */
export function invalidateArticleLikeStatus(queryClient: ReturnType<typeof useQueryClient>, articleId: string) {
  queryClient.invalidateQueries({ queryKey: ['article-like-status', articleId] });
}

/**
 * Helper function to manually update like status cache without refetching.
 * Useful for optimistic updates.
 * 
 * @param queryClient - The React Query client instance
 * @param articleId - The ID of the article to update
 * @param isLiked - The new liked status
 */
export function setArticleLikeStatus(queryClient: ReturnType<typeof useQueryClient>, articleId: string, isLiked: boolean) {
  queryClient.setQueryData(['article-like-status', articleId], isLiked);
}
