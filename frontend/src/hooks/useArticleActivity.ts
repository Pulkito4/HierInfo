'use client';

import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { trackArticleActivity } from '@/lib/react-query';
import type { TrackArticleActivityInput } from '@/lib/react-query';

type UseArticleActivityResult = {
  trackActivity: (eventType: TrackArticleActivityInput['eventType']) => void;
  isPending: boolean;
};

export function useArticleActivity(articleId: string): UseArticleActivityResult {
  const mutation = useMutation({
    mutationFn: trackArticleActivity,
    onError: (error) => {
      console.error('Failed to track user activity', error);
    },
  });

  const trackActivity = useCallback(
    (eventType: TrackArticleActivityInput['eventType']) => {
      mutation.mutate({ articleId, eventType });
    },
    [articleId, mutation]
  );

  return {
    trackActivity,
    isPending: mutation.isPending,
  };
}
