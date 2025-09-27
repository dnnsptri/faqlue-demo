import { NextResponse } from "next/server";

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

    // Log the event (in a real implementation, you'd save to database)
    console.log("FAQ Event:", {
      context,
      type,
      query: type === "search" ? query : undefined,
      item_id: type === "click" ? item_id : undefined,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error logging FAQ event:", error);
    return NextResponse.json(
      { error: "Failed to log event" },
      { status: 500 }
    );
  }
}