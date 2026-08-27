import { NextRequest, NextResponse } from "next/server";
import { tmdb } from "@/lib/tmdb";
import { PUBLIC_CACHE } from "@/lib/cache";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const filmId = parseInt(id, 10);

  if (isNaN(filmId)) {
    return NextResponse.json({ error: "Invalid film ID" }, { status: 400 });
  }

  try {
    const data = await tmdb.filmDetails(filmId);
    return NextResponse.json(data, { headers: { "Cache-Control": PUBLIC_CACHE } });
  } catch (err) {
    console.error("Film details error:", err);
    return NextResponse.json({ error: "Film not found" }, { status: 404 });
  }
}
