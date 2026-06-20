import { NextRequest, NextResponse } from "next/server";
import { tmdb } from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  const page = request.nextUrl.searchParams.get("page") ?? "1";

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ results: [], total_pages: 0, total_results: 0 });
  }

  try {
    const data = await tmdb.search(query.trim(), page);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
