import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { context, type, query, item_id } = body;

    // Validate required fields
    if (!context || !type) {
      return NextResponse.json(
        { error: "Missing required fields: context and type" },
        { status: 400 }
      );
    }

    // Validate type
    if (!["search", "click"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'search' or 'click'" },
        { status: 400 }
      );
    }

    // For search events, query is required
    if (type === "search" && !query) {
      return NextResponse.json(
        { error: "Query is required for search events" },
        { status: 400 }
      );
    }

    // For click events, item_id is required
    if (type === "click" && !item_id) {
      return NextResponse.json(
        { error: "item_id is required for click events" },
        { status: 400 }
      );
    }

    // Persist event to Supabase for server-side ranking
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE as string;
    if (SUPABASE_URL && SERVICE_ROLE_KEY) {
      const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

      // Resolve context_id for optional validation (best-effort)
      let context_id: string | null = null;
      try {
        const { data: ctx } = await admin
          .from("faq_contexts")
          .select("id")
          .eq("context_slug", context)
          .single();
        context_id = ctx?.id ?? null;
      } catch {}

      await admin.from("faq_events").insert({
        context_id,
        item_id: type === "click" ? item_id : null,
        event_type: type,
        query: type === "search" ? query : null,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error logging FAQ event:", error);
    return NextResponse.json(
      { error: "Failed to log event" },
      { status: 500 }
    );
  }
}