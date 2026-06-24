"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFavourites } from "@/context/FavouritesContext";
import FilmGrid from "@/components/FilmGrid";
import SortableFilmGrid from "@/components/SortableFilmGrid";
import { Film } from "@/lib/types";
import Link from "next/link";

export default function RecommendationsPage() {
  const { interactions, isLoading, isLoggedIn } = useFavourites();
  const [films, setFilms] = useState<Film[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadCount, setLoadCount] = useState(0);
  const hasFetched = useRef(false);

  // Pull a fresh set of recommendations from the interactions as they stand now.
  // Reads interactions via ref-free closure on each call, so the latest dislikes
  // feed into the taste profile when the user hits Refresh.
  const load = useCallback(() => {
    const liked = interactions
      .filter((i) => i.interaction === "like")
      .map((i) => i.tmdb_id);

    const saved = interactions
      .filter((i) => i.interaction === "watchlist" || i.interaction === "watched")
      .map((i) => i.tmdb_id);

    const disliked = interactions
      .filter((i) => i.interaction === "dislike")
      .map((i) => i.tmdb_id);

    setFetching(true);
    setError(null);

    return fetch("/api/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ liked, saved, disliked }),
    })
      .then((r) => r.json())
      .then((data) => {
        setFilms(data.results ?? []);
        setLoadCount((c) => c + 1);   // remount the grid so a Refresh replaces, not appends
      })
      .catch(() => setError("Failed to load recommendations. Please try again."))
      .finally(() => setFetching(false));
  }, [interactions]);

  useEffect(() => {
    if (isLoading || hasFetched.current) return;
    // Fetch once on load. We intentionally do NOT auto-refetch as interactions
    // change, so saving or disliking a film doesn't make the grid reshuffle
    // underneath you — use the Refresh button to pull a new set.
    hasFetched.current = true;
    load();
  }, [isLoading, load]);

  if (!isLoggedIn) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center">
        <p className="text-zinc-400 text-lg mb-4">
          Sign in to get personalised recommendations.
        </p>
      </div>
    );
  }

  const likedCount = interactions.filter((i) => i.interaction === "watchlist" || i.interaction === "watched" || i.interaction === "like").length;

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
        <h1 className="text-2xl font-bold text-white">For you</h1>
        {likedCount === 0 ? (
          <p className="text-zinc-400 text-sm mt-2">
            Save some films to get personalised recommendations.{" "}
            <Link href="/" className="text-brand underline">
              Browse trending
            </Link>
          </p>
        ) : (
          <p className="text-zinc-500 text-sm mt-2">
            Based on your saved films — directors, cast, genres and themes you like.
          </p>
        )}
        </div>
        {likedCount > 0 && (
          <button
            onClick={() => load()}
            disabled={fetching}
            className="shrink-0 flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <svg className={`w-4 h-4 ${fetching ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a8 8 0 0114-3m2 8a8 8 0 01-14 3" />
            </svg>
            {fetching ? "Finding…" : "Refresh"}
          </button>
        )}
      </div>

      {error && (
        <p className="text-amber-400 text-sm mb-6">{error}</p>
      )}

      {fetching ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-zinc-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <SortableFilmGrid
          key={loadCount}
          films={films}
          emptyMessage="No recommendations yet — save some films first!"
        />
      )}
    </div>
  );
}
