import { NextRequest, NextResponse } from "next/server";
import { tmdb } from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  const page = request.nextUrl.searchParams.get("page") ?? "1";
  try {
    const data = await tmdb.trending(page);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Trending error:", err);
    return NextResponse.json({ error: "Failed to fetch trending" }, { status: 500 });
  }
}
