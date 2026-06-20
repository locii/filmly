import { NextRequest, NextResponse } from "next/server";
import { tmdb } from "@/lib/tmdb";
import { Film } from "@/lib/types";

// Takes a list of saved tmdb IDs, fetches recommendations for each, deduplicates.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const savedIds: number[] = body.saved ?? [];

    if (savedIds.length === 0) {
      const trending = await tmdb.trending("1") as { results: Film[] };
      return NextResponse.json({ results: trending.results.slice(0, 20) });
    }

    // Use up to 5 most recently saved films as sources
    const sourceIds = savedIds.slice(-5);

    const results = await Promise.allSettled(
      sourceIds.map((id) => tmdb.recommendations(id) as Promise<{ results: Film[] }>)
    );

    const seen = new Set<number>(savedIds);
    const merged: Film[] = [];

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        result.value.results.forEach((film) => {
          if (!seen.has(film.id)) {
            seen.add(film.id);
            merged.push(film);
          }
        });
      }
    });

    merged.sort((a, b) => b.vote_average - a.vote_average);

    return NextResponse.json({ results: merged.slice(0, 40) });
  } catch (err) {
    console.error("Recommendations error:", err);
    return NextResponse.json({ error: "Failed to fetch recommendations" }, { status: 500 });
  }
}
