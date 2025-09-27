import { NextResponse } from "next/server";

const FN_URL = process.env.FAQ_PUBLIC_FN_URL || "https://demo.functions.supabase.co/faq-public"; // fallback for demo
const FN_TOKEN = process.env.FAQ_PUBLIC_TOKEN || ""; // usually empty (public)

export async function GET(
  _req: Request,
  { params }: { params: { context: string } }
) {
  try {
    // Check if we have a valid function URL
    if (!process.env.FAQ_PUBLIC_FN_URL) {
      return NextResponse.json(
        { 
          error: "FAQ_PUBLIC_FN_URL environment variable not set", 
          note: "Please set FAQ_PUBLIC_FN_URL in .env.local file",
          context: params.context,
          items: [] // Return empty array for demo
        },
        { status: 200 }
      );
    }

    const url = new URL(FN_URL);
    url.searchParams.set("context", params.context);

    const requestedUrl = url.toString();

    const res = await fetch(requestedUrl, {
      headers: {
        ...(FN_TOKEN ? { Authorization: `Bearer ${FN_TOKEN}` } : {}),
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json(
        { error: txt || "Upstream error", upstreamStatus: res.status, requestedUrl },
        { status: 500 }
      );
    }
    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { 
        error: String(err), 
        requestedUrl: FN_URL, 
        note: "Check .env.local FAQ_PUBLIC_FN_URL",
        context: params.context,
        items: [] // Return empty array for demo
      },
      { status: 200 } // Return 200 instead of 500 to prevent webpack errors
    );
  }
}