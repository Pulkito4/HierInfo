import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const ALLOWED_EVENT_TYPES = new Set([
  "like",
  "dislike",
  "view",
  "impression",
]);

type RequestPayload = {
  articleId?: string;
  eventType?: string;
};

type UpsertPayload = {
  user_id: string;
  article_id: string;
  event_type: string;
  created_at: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RequestPayload;
    const articleId = body.articleId?.trim();
    const eventType = body.eventType?.trim().toLowerCase();

    if (!articleId) {
      return NextResponse.json(
        { error: "Missing required field: articleId" },
        { status: 400 }
      );
    }

    if (!eventType || !ALLOWED_EVENT_TYPES.has(eventType)) {
      return NextResponse.json(
        { error: "Invalid event type" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
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

    const payload: UpsertPayload = {
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
