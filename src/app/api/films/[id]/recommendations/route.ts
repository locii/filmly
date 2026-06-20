import { NextRequest, NextResponse } from "next/server";
import { tmdb } from "@/lib/tmdb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const filmId = parseInt(id, 10);
  const page = request.nextUrl.searchParams.get("page") ?? "1";

  if (isNaN(filmId)) {
    return NextResponse.json({ error: "Invalid film ID" }, { status: 400 });
  }

  try {
    const [recommendations, similar] = await Promise.all([
      tmdb.recommendations(filmId, page) as Promise<{ results: unknown[] }>,
      tmdb.similar(filmId, page) as Promise<{ results: unknown[] }>,
    ]);

    // Merge and deduplicate
    const seen = new Set<number>();
    const merged = [...(recommendations.results ?? []), ...(similar.results ?? [])].filter(
      (film) => {
        const f = film as { id: number };
        if (seen.has(f.id)) return false;
        seen.add(f.id);
        return true;
      }
    );

    return NextResponse.json({ results: merged });
  } catch (err) {
    console.error("Recommendations error:", err);
    return NextResponse.json({ error: "Failed to fetch recommendations" }, { status: 500 });
  }
}
