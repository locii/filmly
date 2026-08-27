import { NextRequest, NextResponse } from "next/server";
import { tmdb } from "@/lib/tmdb";
import { PUBLIC_CACHE } from "@/lib/cache";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const page = request.nextUrl.searchParams.get("page") ?? "1";

  try {
    const data = await tmdb.byGenre(id, page);
    return NextResponse.json(data, { headers: { "Cache-Control": PUBLIC_CACHE } });
  } catch (err) {
    console.error("Genre films error:", err);
    return NextResponse.json({ error: "Failed to fetch genre films" }, { status: 500 });
  }
}
