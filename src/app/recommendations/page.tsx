"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (isLoading) return;

    const saved = interactions
      .filter((i) => i.interaction === "favourite")
      .map((i) => i.tmdb_id);

    setFetching(true);
    setError(null);

    fetch("/api/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ saved }),
    })
      .then((r) => r.json())
      .then((data) => setFilms(data.results ?? []))
      .catch(() => setError("Failed to load recommendations. Please try again."))
      .finally(() => setFetching(false));
  }, [interactions, isLoading]);

  if (!isLoggedIn) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-zinc-400 text-lg mb-4">
          Sign in to get personalised recommendations.
        </p>
      </div>
    );
  }

  const likedCount = interactions.filter((i) => i.interaction === "favourite").length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
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
            Based on {likedCount} saved film{likedCount !== 1 ? "s" : ""}.
          </p>
        )}
      </div>

      {error && (
        <p className="text-red-400 text-sm mb-6">{error}</p>
      )}

      {fetching ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-zinc-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <SortableFilmGrid
          films={films}
          emptyMessage="No recommendations yet — save some films first!"
        />
      )}
    </div>
  );
}
