import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
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

type ServerSupabaseClient = ReturnType<typeof createServerClient>;

async function resolveUser(
  request: NextRequest,
  supabase: ServerSupabaseClient
) {
  const authorization = request.headers.get("authorization");
  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  if (bearerToken) {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL!}/auth/v1/user`,
        {
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${bearerToken}`,
          },
          cache: "no-store",
        }
      );

      if (response.ok) {
        const data = (await response.json()) as User;
        if (data?.id) {
          return { user: data, error: null, accessToken: bearerToken } as const;
        }
      }
    } catch {
      // Ignore bearer resolution failures and fall back to cookie-based lookup.
    }
  }

  const { data, error } = await supabase.auth.getUser();
  return { user: data.user, error, accessToken: null } as const;
}

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

  const { user, error: authError, accessToken } = await resolveUser(request, supabase);

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

    const writerClient: SupabaseClient = accessToken
      ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        })
      : (supabase as unknown as SupabaseClient);

    const { error: upsertError } = await writerClient
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
