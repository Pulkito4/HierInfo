import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export type TabType = 'personal' | 'explore' | 'settings';
export type SubTabType = 'feed' | 'trending';

export const useTabNavigation = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeTab = (searchParams.get('tab') || 'personal') as TabType;
  const personalSubTab = (searchParams.get('subTab') || 'feed') as SubTabType;

  const setActiveTab = useCallback(
    (tab: TabType) => {
      const params = new URLSearchParams(searchParams);
      params.set('tab', tab);
      if (tab === 'personal') {
        if (!params.get('subTab')) {
          params.set('subTab', 'feed');
        }
      } else {
        params.delete('subTab');
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const setPersonalSubTab = useCallback(
    (subTab: SubTabType) => {
      const params = new URLSearchParams(searchParams);
      params.set('tab', 'personal');
      params.set('subTab', subTab);
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  return {
    activeTab,
    personalSubTab,
    setActiveTab,
    setPersonalSubTab,
  };
};
