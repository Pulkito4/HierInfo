'use client';

import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';

type ActivityEvent = 'like' | 'dislike' | 'view' | 'impression';

interface MutationPayload {
  articleId: string;
  eventType: ActivityEvent;
}

interface UseArticleActivityResult {
  trackActivity: (eventType: ActivityEvent) => void;
  isPending: boolean;
}

export function useArticleActivity(articleId: string): UseArticleActivityResult {
  const mutation = useMutation({
    mutationFn: async ({ articleId, eventType }: MutationPayload) => {
      const response = await fetch('/api/user-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ articleId, eventType }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const message = (errorBody && errorBody.error) || 'Failed to record activity';
        throw new Error(message);
      }
    },
    onError: (error) => {
      console.error('Failed to track user activity', error);
    },
  });

  const trackActivity = useCallback(
    (eventType: ActivityEvent) => {
      mutation.mutate({ articleId, eventType });
    },
    [articleId, mutation]
  );

  return {
    trackActivity,
    isPending: mutation.isPending,
  };
}
