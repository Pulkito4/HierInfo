import { NextRequest, NextResponse } from "next/server";
import { createRouteSupabaseClient } from "@/lib/server/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get("articleId");
    const eventType = searchParams.get("eventType");

    if (!articleId || !eventType) {
      return NextResponse.json(
        { error: "Missing required parameters: articleId and eventType" },
        { status: 400 }
      );
    }

    const supabase = await createRouteSupabaseClient(request);
    const { data: userData, error: authError } = await supabase.auth.getUser();
    const user = userData?.user ?? null;

    if (authError || !user?.id) {
      return NextResponse.json({ exists: false });
    }

    // Check if record exists in user_activity table
    const { data, error } = await supabase
      .from("user_activity")
      .select("id")
      .eq("user_id", user.id)
      .eq("article_id", articleId)
      .eq("event_type", eventType)
      .maybeSingle();

    if (error) {
      console.error("Error checking user activity:", error);
      return NextResponse.json({ exists: false });
    }

    // Return with caching headers to reduce repeated requests
    return NextResponse.json(
      { exists: !!data },
      {
        headers: {
          'Cache-Control': 'private, max-age=300', // Cache for 5 minutes (client-side only)
        }
      }
    );
  } catch (error) {
    console.error("Error in check endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
