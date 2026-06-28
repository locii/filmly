"use client";

import { useEffect, useState } from "react";
import { useFavourites } from "@/context/FavouritesContext";
import GenreRow, { interactionToFilm } from "@/components/GenreRow";
import UpNextRow from "@/components/UpNextRow";
import FilmCard from "@/components/FilmCard";
import { FilmRatings } from "@/lib/types";
import Link from "next/link";

type Tab = "toWatch" | "watched";

const GENRE_NAMES: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
  27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Science Fiction",
  10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western",
};

function groupByGenre(films: ReturnType<typeof useFavourites>["interactions"]) {
  const byGenre = new Map<number, typeof films>();
  const noGenre: typeof films = [];

  films.forEach((film) => {
    if (!film.genre_ids || film.genre_ids.length === 0) {
      noGenre.push(film);
      return;
    }
    film.genre_ids.forEach((gid) => {
      if (!byGenre.has(gid)) byGenre.set(gid, []);
      byGenre.get(gid)!.push(film);
    });
  });

  const sortedGenres = [...byGenre.entries()].sort((a, b) => b[1].length - a[1].length);
  return { sortedGenres, noGenre };
}

function FilmSection({
  films,
  empty,
  enableQueue,
  ratings,
}: {
  films: ReturnType<typeof useFavourites>["interactions"];
  empty: string;
  enableQueue?: boolean;
  ratings?: FilmRatings;
}) {
  const { toggleWatchNext } = useFavourites();
  const { sortedGenres, noGenre } = groupByGenre(films);

  return (
    <div className="mb-14">
      {films.length === 0 ? (
        <p className="text-zinc-500 text-sm">{empty}</p>
      ) : (
        <div className="space-y-10">
          {sortedGenres.map(([genreId, genreFilms]) => (
            <GenreRow
              key={genreId}
              genreId={genreId}
              genreName={GENRE_NAMES[genreId] ?? "Other"}
              films={genreFilms}
              enableQueue={enableQueue}
              ratings={ratings}
            />
          ))}
          {noGenre.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">Other</h3>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {noGenre.map((film) => (
                  <div key={film.tmdb_id} className="shrink-0 w-48">
                    <FilmCard
                      film={interactionToFilm(film, ratings)}
                      queue={enableQueue ? {
                        inQueue: film.queue_position != null,
                        onToggle: () => toggleWatchNext(film.tmdb_id),
                      } : undefined}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export default function WatchlistPage() {
  const { interactions, isLoading, isLoggedIn } = useFavourites();
  const [tab, setTab] = useState<Tab>("toWatch");
  const [ratings, setRatings] = useState<FilmRatings>({});

  // Stored interactions don't carry score/year — fetch them once per id set.
  const idsKey = [...new Set(interactions.map((i) => i.tmdb_id))]
    .sort((a, b) => a - b)
    .join(",");
  useEffect(() => {
    if (!idsKey) return;
    let cancelled = false;
    fetch(`/api/films/ratings?ids=${idsKey}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setRatings(d.ratings ?? {}); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [idsKey]);

  if (!isLoggedIn) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center">
        <p className="text-zinc-400 text-lg mb-2">Sign in to use your watchlist.</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="max-w-7xl mx-auto p-8 text-center text-zinc-500">Loading…</div>;
  }

  // Watchlist and watched are independent. Marking a film watched clears its
  // bookmark, so "To Watch" only shows films the user has actively bookmarked —
  // including ones they've already watched and re-bookmarked to rewatch.
  const toWatch = interactions.filter((i) => i.interaction === "watchlist");
  const watched = interactions.filter((i) => i.interaction === "watched");
  const total = toWatch.length + watched.length;

  // "Up Next" queue (ordered) shown above the genre-grouped rest.
  const queued = toWatch
    .filter((i) => i.queue_position != null)
    .sort((a, b) => (a.queue_position ?? 0) - (b.queue_position ?? 0));
  const rest = toWatch.filter((i) => i.queue_position == null);

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Watchlist</h1>
          {total > 0 && (
            <p className="text-zinc-500 text-sm mt-1">
              {toWatch.length} to watch · {watched.length} watched
            </p>
          )}
        </div>
        <Link
          href="/recommendations"
          className="text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg transition-colors"
        >
          For You →
        </Link>
      </div>

      {total === 0 ? (
        <div className="py-16 text-center">
          <p className="text-zinc-400 text-lg mb-2">Nothing saved yet.</p>
          <p className="text-zinc-600 text-sm mb-6">Bookmark films to add them to your watchlist.</p>
          <Link href="/" className="text-sm bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-lg transition-colors">
            Browse films
          </Link>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex items-center gap-2 mb-8 border-b border-zinc-800">
            {([
              { key: "toWatch" as Tab, label: "To Watch", count: toWatch.length },
              { key: "watched" as Tab, label: "Watched", count: watched.length },
            ]).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative px-4 py-2.5 text-sm font-medium transition-colors -mb-px border-b-2 ${
                  tab === t.key
                    ? "text-white border-amber-500"
                    : "text-zinc-500 border-transparent hover:text-zinc-300"
                }`}
              >
                {t.label}
                <span className={`ml-2 text-xs ${tab === t.key ? "text-amber-400" : "text-zinc-600"}`}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          {tab === "toWatch" ? (
            <>
              {queued.length > 0 && <UpNextRow films={queued} ratings={ratings} />}
              {rest.length > 0 ? (
                <FilmSection
                  films={rest}
                  empty=""
                  enableQueue
                  ratings={ratings}
                />
              ) : queued.length === 0 ? (
                <p className="text-zinc-500 text-sm">
                  No films in your watchlist yet — bookmark any film to add it here.
                </p>
              ) : null}
            </>
          ) : (
            <FilmSection
              films={watched}
              empty="No films marked as watched yet."
              ratings={ratings}
            />
          )}
        </>
      )}
    </div>
  );
}
