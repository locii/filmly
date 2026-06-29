import { NextRequest, NextResponse } from "next/server";
import { tmdb } from "@/lib/tmdb";
import { Person, Film } from "@/lib/types";

// Latest films for a followed person — powers the "Directors / Actors I follow"
// rows on the watchlist. Directors get their directing credits; everyone else
// (actors) gets their acting credits. Returns a trimmed, deduped, date-sorted list.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const personId = parseInt(id, 10);
  if (isNaN(personId)) {
    return NextResponse.json({ films: [], department: null }, { status: 400 });
  }

  try {
    const person = (await tmdb.person(personId)) as Person;
    const isDirector = person.known_for_department === "Directing";

    const credits: Film[] = isDirector
      ? (person.movie_credits?.crew ?? [])
          .filter((c) => c.job === "Director")
          .map(({ job: _j, department: _d, ...f }) => f)
      : (person.movie_credits?.cast ?? []).map(({ character: _c, ...f }) => f);

    const seen = new Set<number>();
    const films = credits
      .filter((f) => f.poster_path && f.release_date)
      .sort((a, b) => (b.release_date ?? "").localeCompare(a.release_date ?? ""))
      .filter((f) => {
        if (seen.has(f.id)) return false;
        seen.add(f.id);
        return true;
      })
      .slice(0, 20);

    return NextResponse.json({
      films,
      department: isDirector ? "Directing" : "Acting",
    });
  } catch {
    return NextResponse.json({ films: [], department: null }, { status: 502 });
  }
}
