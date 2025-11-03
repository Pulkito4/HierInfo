import { NextRequest, NextResponse } from "next/server";
import { createRouteSupabaseClient } from "@/lib/server/auth";
import type {
  UserActivityEventType,
  UserActivityRequestPayload,
  UserActivityUpsertPayload,
} from "@/types/api";

const ALLOWED_EVENT_TYPES: Set<UserActivityEventType> = new Set([
  "like",
  "dislike",
  "view",
  "impression",
]);

function normalizeEventType(value?: string): UserActivityEventType | null {
  if (!value) return null;
  const lowered = value.trim().toLowerCase();
  return ALLOWED_EVENT_TYPES.has(lowered as UserActivityEventType)
    ? (lowered as UserActivityEventType)
    : null;
}

// Build one per-request Supabase client (cookie-bound) and fetch user once when needed.

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as UserActivityRequestPayload;
    const articleId = body.articleId?.trim();
    const eventType = normalizeEventType(body.eventType);

    if (!articleId) {
      return NextResponse.json(
        { error: "Missing required field: articleId" },
        { status: 400 }
      );
    }

    if (!eventType) {
      return NextResponse.json(
        { error: "Invalid event type" },
        { status: 400 }
      );
    }

  const supabase = await createRouteSupabaseClient(request);
  const { data: userData, error: authError } = await supabase.auth.getUser();
  const user = userData?.user ?? null;

    if (authError && authError.message && authError.message !== "Auth session missing") {
      return NextResponse.json(
        { error: "Authentication failed", details: authError.message },
        { status: 401 }
      );
    }

    if (!user?.id) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );
    }

    const payload: UserActivityUpsertPayload = {
      user_id: user.id,
      article_id: articleId,
      event_type: eventType,
      created_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from("user_activity")
      .upsert(payload, {
        onConflict: "user_id,article_id,event_type",
      });

    if (upsertError) {
      return NextResponse.json(
        { error: "Failed to record activity", details: upsertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Invalid request payload",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 400 }
    );
  }
}
