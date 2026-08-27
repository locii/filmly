import { NextRequest, NextResponse } from "next/server";
import { tmdb } from "@/lib/tmdb";
import { PUBLIC_CACHE } from "@/lib/cache";

export async function GET(request: NextRequest) {
  const page = request.nextUrl.searchParams.get("page") ?? "1";
  try {
    const data = await tmdb.trending(page);
    return NextResponse.json(data, { headers: { "Cache-Control": PUBLIC_CACHE } });
  } catch (err) {
    console.error("Trending error:", err);
    return NextResponse.json({ error: "Failed to fetch trending" }, { status: 500 });
  }
}
