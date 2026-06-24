import { NextRequest, NextResponse } from "next/server";
import { tmdb } from "@/lib/tmdb";
import { Film, Genre } from "@/lib/types";

// Shape returned by tmdb.filmProfile (details + credits + keywords in one call).
interface ProfileMovie {
  genres?: Genre[];
  credits?: {
    cast?: { id: number; name: string; order: number }[];
    crew?: { id: number; name: string; job: string }[];
  };
  keywords?: { keywords?: { id: number; name: string }[] };
}

// A weighted frequency table of people / genres / keywords across saved films.
type Tally = Map<number, { name: string; weight: number }>;

function bump(tally: Tally, id: number, name: string, w: number) {
  const cur = tally.get(id);
  if (cur) cur.weight += w;
  else tally.set(id, { name, weight: w });
}

function topPositive(tally: Tally, n: number) {
  return [...tally.entries()]
    .filter(([, v]) => v.weight > 0)
    .sort((a, b) => b[1].weight - a[1].weight)
    .slice(0, n)
    .map(([id, v]) => ({ id, name: v.name, weight: v.weight }));
}

// How many of each input we'll fetch full credits for, to keep the request fast.
const MAX_POSITIVE_PROFILE = 40;
const MAX_NEGATIVE_PROFILE = 25;

// Walk a set of film ids, fetch their credits/keywords, and fold them into the
// running tallies with the given sign (+ for liked, − for disliked).
async function foldProfile(
  ids: number[],
  sign: number,
  directors: Tally,
  actors: Tally,
  genres: Tally,
  keywords: Tally,
) {
  const res = await Promise.allSettled(
    ids.map((id) => tmdb.filmProfile(id) as Promise<ProfileMovie>),
  );
  res.forEach((r) => {
    if (r.status !== "fulfilled") return;
    const m = r.value;
    m.credits?.crew
      ?.filter((c) => c.job === "Director")
      .forEach((d) => bump(directors, d.id, d.name, sign));
    m.credits?.cast
      ?.slice(0, 3)
      .forEach((a) => bump(actors, a.id, a.name, sign));
    m.genres?.forEach((g) => bump(genres, g.id, g.name, sign));
    m.keywords?.keywords
      ?.slice(0, 6)
      .forEach((k) => bump(keywords, k.id, k.name, sign));
  });
}

interface Tagged {
  film: Film;
  reason: string;
  // Lower = higher priority among the query types (directors beat genres, etc.)
  priority: number;
}

// Run a /discover query and tag each result with the reason it surfaced.
async function discoverTagged(
  params: Record<string, string>,
  reason: string,
  priority: number,
): Promise<Tagged[]> {
  try {
    const data = (await tmdb.discover({
      ...params,
      sort_by: "vote_count.desc",
      "vote_count.gte": "150",
      include_adult: "false",
    })) as { results: Film[] };
    return data.results.map((film) => ({ film, reason, priority }));
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const likedIds: number[] = body.liked ?? [];          // explicit thumbs-up
    const savedIds: number[] = body.saved ?? [];           // watchlist + watched
    const dislikedIds: number[] = body.disliked ?? [];

    const positiveIds = [...new Set([...likedIds, ...savedIds])];

    // No history yet → trending starter pack.
    if (positiveIds.length === 0) {
      const trending = (await tmdb.trending("1")) as { results: Film[] };
      return NextResponse.json({ results: trending.results.slice(0, 20) });
    }

    // Build the taste profile. Likes are weighted higher than passive saves.
    const directors: Tally = new Map();
    const actors: Tally = new Map();
    const genres: Tally = new Map();
    const keywords: Tally = new Map();

    // Sample most-recent inputs to cap the number of API calls.
    const likedSample = likedIds.slice(-MAX_POSITIVE_PROFILE);
    const savedSample = savedIds
      .filter((id) => !likedIds.includes(id))
      .slice(-(MAX_POSITIVE_PROFILE - likedSample.length));
    const dislikedSample = dislikedIds.slice(-MAX_NEGATIVE_PROFILE);

    await Promise.all([
      foldProfile(likedSample, 2, directors, actors, genres, keywords),
      foldProfile(savedSample, 1, directors, actors, genres, keywords),
      foldProfile(dislikedSample, -1.5, directors, actors, genres, keywords),
    ]);

    const topDirectors = topPositive(directors, 4);
    const topActors = topPositive(actors, 4);
    const topGenres = topPositive(genres, 3);
    const topKeywords = topPositive(keywords, 4);

    // Genres the user keeps disliking — used to penalise results later.
    const negativeGenres = new Set(
      [...genres.entries()].filter(([, v]) => v.weight < 0).map(([id]) => id),
    );

    // Build a fan of discover queries, one per strong signal, each self-describing.
    const queries: Promise<Tagged[]>[] = [];
    topDirectors.forEach((d) =>
      queries.push(discoverTagged({ with_crew: String(d.id) }, `Because you like ${d.name}`, 0)),
    );
    topActors.forEach((a) =>
      queries.push(discoverTagged({ with_cast: String(a.id) }, `Starring ${a.name}`, 1)),
    );
    topKeywords.forEach((k) =>
      queries.push(discoverTagged({ with_keywords: String(k.id) }, `${capitalise(k.name)} films`, 2)),
    );
    topGenres.forEach((g) =>
      queries.push(discoverTagged({ with_genres: String(g.id) }, `${g.name} you might like`, 3)),
    );

    // Fall back to the old per-film endpoint if we somehow built no signals.
    if (queries.length === 0) {
      const sourceIds = positiveIds.slice(-5);
      const recs = await Promise.allSettled(
        sourceIds.map((id) => tmdb.recommendations(id) as Promise<{ results: Film[] }>),
      );
      const seen = new Set([...positiveIds, ...dislikedIds]);
      const merged: Film[] = [];
      recs.forEach((r) => {
        if (r.status !== "fulfilled") return;
        r.value.results.forEach((f) => {
          if (!seen.has(f.id)) {
            seen.add(f.id);
            merged.push({ ...f, reason: "Similar to films you saved" });
          }
        });
      });
      merged.sort((a, b) => b.vote_average - a.vote_average);
      return NextResponse.json({ results: merged.slice(0, 40) });
    }

    const settled = await Promise.allSettled(queries);
    const exclude = new Set([...positiveIds, ...dislikedIds]);

    // Merge: films matching multiple signals score higher; quality nudges; films
    // heavy in disliked genres get penalised.
    const byId = new Map<number, { film: Film; reason: string; score: number }>();
    settled.forEach((s) => {
      if (s.status !== "fulfilled") return;
      s.value.forEach(({ film, reason, priority }, idx) => {
        if (exclude.has(film.id)) return;

        const rankScore = Math.max(0, 1 - idx / 20);            // earlier in list is better
        const quality = (film.vote_average ?? 0) / 10;
        const priorityBonus = (4 - priority) * 0.25;            // directors > actors > keywords > genres
        const genrePenalty =
          (film.genre_ids ?? []).filter((g) => negativeGenres.has(g)).length * 0.3;
        const score = rankScore + quality + priorityBonus - genrePenalty;

        const existing = byId.get(film.id);
        if (existing) {
          // Multi-signal boost. Queries are appended in priority order and
          // settled in that order, so the reason set first is already the best.
          existing.score += score + 0.4;
        } else {
          byId.set(film.id, { film: { ...film, reason }, reason, score });
        }
      });
    });

    const results = [...byId.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, 40)
      .map((r) => r.film);

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Recommendations error:", err);
    return NextResponse.json({ error: "Failed to fetch recommendations" }, { status: 500 });
  }
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
