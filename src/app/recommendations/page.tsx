"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFavourites } from "@/context/FavouritesContext";
import { useAuthPrompt } from "@/context/AuthPromptContext";
import FilmGrid from "@/components/FilmGrid";
import SortableFilmGrid from "@/components/SortableFilmGrid";
import { Film } from "@/lib/types";
import Link from "next/link";

export default function RecommendationsPage() {
  const { interactions, isLoading, isLoggedIn } = useFavourites();
  const { promptSignup } = useAuthPrompt();
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
    const features = [
      {
        title: "Picks tuned to you",
        body: "Recommendations built from the directors, cast, genres and themes you actually like.",
        path: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z",
      },
      {
        title: "Save & track films",
        body: "Build a watchlist, queue up what's next, and mark off what you've already seen.",
        path: "M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z",
      },
      {
        title: "Curate & share stacks",
        body: "Hand-pick films into shareable collections — or generate a whole stack from a vibe.",
        path: "M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3",
      },
      {
        title: "Discover by vibe",
        body: "Describe a mood, era or theme in plain words and our AI pulls matching films instantly.",
        path: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z",
      },
    ];

    return (
      <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center">
        <p className="text-xs uppercase tracking-wider text-brand font-medium">Recommendations</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-white">
          Films picked just for you
        </h1>
        <p className="mt-3 text-zinc-400 text-base sm:text-lg max-w-xl mx-auto">
          Create a free account and FilmStack learns your taste — the more you save and rate,
          the sharper your recommendations get.
        </p>

        <div className="mt-8 flex flex-col items-center gap-2">
          <button
            onClick={() => promptSignup("Sign up free to unlock personal recommendations.")}
            className="bg-brand hover:bg-brand-dark text-white font-semibold text-base px-8 py-3.5 rounded-xl transition-colors shadow-lg shadow-brand/20"
          >
            Sign up free
          </button>
          <p className="text-zinc-500 text-xs">
            Free forever · no password · no card required
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 text-left">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors"
            >
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-brand/10 text-brand mb-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={f.path} />
                </svg>
              </div>
              <h3 className="text-white font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-zinc-400 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const likedCount = interactions.filter((i) => i.interaction === "watchlist" || i.interaction === "watched" || i.interaction === "like").length;

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
        <h1 className="text-2xl font-bold text-white">Recommendations</h1>
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
