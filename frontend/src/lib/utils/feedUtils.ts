export const isLoading = (state: 'loading' | 'error' | 'success' | 'idle') => 
  state === 'loading' || state === 'idle';

export const shouldShowSkeleton = (
  loading: 'loading' | 'error' | 'success' | 'idle',
  itemsLength: number
) => isLoading(loading) && itemsLength === 0;
