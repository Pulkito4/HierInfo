/**
 * Payload contracts for recording user-level article interactions.
 */
export type UserActivityEventType = "like" | "dislike" | "view" | "impression";

export type UserActivityRequestPayload = {
  articleId?: string;
  eventType?: string;
};

export type UserActivityUpsertPayload = {
  user_id: string;
  article_id: string;
  event_type: UserActivityEventType;
  created_at: string;
};
