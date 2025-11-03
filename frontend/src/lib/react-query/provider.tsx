"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "./client";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/authContext";
import type { CacheVersionRow } from "@/types/api";
import type { Profile } from "@/types/profiles";
import { EXPLORE_KEY_ROOT, FEED_KEY_ROOT, FEED_NAME_CRITICAL, FEED_NAME_DAILY_DIGEST, FEED_NAME_TRENDING, REALTIME_CHANNEL_CACHE_VERSIONS, REALTIME_CHANNEL_PROFILES } from "@/lib/constants";

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * Wraps the application with React Query state management.
 */
export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export function RealtimeCacheInvalidator() {
  const qc = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    // Subscribe to cache_versions updates to invalidate digest feeds
    const cacheChannel = supabase
      .channel(REALTIME_CHANNEL_CACHE_VERSIONS)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "cache_versions" },
        (payload) => {
          try {
            const row = (payload as any).new as Partial<CacheVersionRow> | undefined;
            const feed = row?.feed_name;
            if (!feed) return;
            if (feed === FEED_NAME_TRENDING) {
              qc.invalidateQueries({ queryKey: [FEED_KEY_ROOT, "trending"] });
            } else if (feed === FEED_NAME_CRITICAL) {
              qc.invalidateQueries({ queryKey: [FEED_KEY_ROOT, "critical"] });
            } else if (feed === FEED_NAME_DAILY_DIGEST) {
              // For You depends on the daily digest; invalidate
              if (user?.id) qc.invalidateQueries({ queryKey: [FEED_KEY_ROOT, "forYou", user.id] });
              // Optionally, Explore can refresh when the day flips
              if (user?.id) qc.invalidateQueries({ queryKey: [EXPLORE_KEY_ROOT, user.id] });
            }
          } catch {
            // no-op
          }
        }
      )
      .subscribe();

    // Subscribe to profile preference updates for current user
    const profilesChannel = supabase
      .channel(REALTIME_CHANNEL_PROFILES)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        (payload) => {
          try {
            const row = (payload as any).new as Partial<Profile> | undefined;
            if (row?.id && row.id === user?.id) {
              qc.invalidateQueries({ queryKey: [FEED_KEY_ROOT, "forYou", row.id] });
            }
          } catch {
            // no-op
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(cacheChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [qc, user?.id]);

  return null;
}
