import { NextRequest, NextResponse } from "next/server";
import { tmdb } from "@/lib/tmdb";
import { FilmDetail } from "@/lib/types";

// Batch lookup of rating + release date for a set of TMDB ids. Used by the
// watchlist, where stored interactions don't carry score/year. Per-film
// failures are skipped so one bad id doesn't sink the whole request.
export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get("ids") ?? "";
  const ids = [...new Set(
    idsParam.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n))
  )].slice(0, 100);

  if (ids.length === 0) return NextResponse.json({ ratings: {} });

  const entries = await Promise.all(
    ids.map(async (id) => {
      try {
        const d = await tmdb.filmDetails(id) as FilmDetail;
        return [id, { vote_average: d.vote_average ?? 0, release_date: d.release_date ?? "" }] as const;
      } catch {
        return null;
      }
    })
  );

  const ratings: Record<number, { vote_average: number; release_date: string }> =
    Object.fromEntries(entries.filter((e): e is NonNullable<typeof e> => e !== null));

  return NextResponse.json({ ratings });
}
