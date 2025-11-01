'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { useArticleActivity } from '@/hooks/useArticleActivity';

const DEFAULT_IMPRESSION_DELAY = 1000; // milliseconds

interface UseArticleImpressionOptions {
  delay?: number;
  threshold?: number;
}

export function useArticleImpression(
  articleId: string,
  { delay = DEFAULT_IMPRESSION_DELAY, threshold = 0.5 }: UseArticleImpressionOptions = {}
) {
  const { trackActivity } = useArticleActivity(articleId);
  const [hasTracked, setHasTracked] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { ref, inView } = useInView({
    threshold,
    triggerOnce: false,
  });

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (hasTracked) {
      clearTimer();
      return;
    }

    if (inView) {
      timeoutRef.current = setTimeout(() => {
        trackActivity('impression');
        setHasTracked(true);
      }, delay);
    } else {
      clearTimer();
    }

    return () => {
      clearTimer();
    };
  }, [clearTimer, delay, hasTracked, inView, trackActivity]);

  const combinedRef = useCallback(
    (node: Element | null) => {
      clearTimer();
      ref(node);
    },
    [clearTimer, ref]
  );

  return {
    ref: combinedRef,
    hasTracked,
  };
}
