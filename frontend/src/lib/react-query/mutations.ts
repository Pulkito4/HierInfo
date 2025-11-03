import { supabase } from "@/lib/supabase";

export type TrackArticleActivityInput = {
  articleId: string;
  eventType: "like" | "dislike" | "view" | "impression";
};

/**
 * Persist user interaction events for analytics and personalization.
 */
export async function trackArticleActivity({
  articleId,
  eventType,
}: TrackArticleActivityInput) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const response = await fetch("/api/user-activity", {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({ articleId, eventType }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = (errorBody && errorBody.error) || "Failed to record activity";
    throw new Error(message);
  }
}
