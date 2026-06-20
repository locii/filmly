"use client";

import { useFavourites } from "@/context/FavouritesContext";
import GenreRow from "@/components/GenreRow";
import FilmCard from "@/components/FilmCard";
import { Film } from "@/lib/types";
import Link from "next/link";

function interactionToFilm(i: ReturnType<typeof useFavourites>["interactions"][0]): Film {
  return {
    id: i.tmdb_id,
    title: i.title,
    poster_path: i.poster_path,
    backdrop_path: null,
    overview: "",
    release_date: "",
    vote_average: 0,
    vote_count: 0,
    genre_ids: i.genre_ids,
  };
}

const GENRE_NAMES: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
  27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Science Fiction",
  10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western",
};

export default function FavouritesPage() {
  const { interactions, isLoading, isLoggedIn } = useFavourites();
  const saved = interactions.filter((i) => i.interaction === "favourite");

  if (!isLoggedIn) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-zinc-400 text-lg mb-2">Sign in to save films.</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-zinc-500">Loading…</div>;
  }

  if (saved.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-zinc-400 text-lg mb-2">Nothing saved yet.</p>
        <p className="text-zinc-600 text-sm mb-6">Tap the ❤️ on any film to save it.</p>
        <Link href="/" className="text-sm bg-brand hover:bg-brand-dark text-white px-5 py-2.5 rounded-lg transition-colors">
          Browse films
        </Link>
      </div>
    );
  }

  // Group saved films by genre
  const byGenre = new Map<number, typeof saved>();
  const noGenre: typeof saved = [];

  saved.forEach((film) => {
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Saved films</h1>
        <Link
          href="/recommendations"
          className="text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg transition-colors"
        >
          All recommendations →
        </Link>
      </div>

      <div className="space-y-10">
        {sortedGenres.map(([genreId, films]) => (
          <GenreRow
            key={genreId}
            genreId={genreId}
            genreName={GENRE_NAMES[genreId] ?? "Other"}
            films={films}
          />
        ))}

        {noGenre.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Other</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {noGenre.map((film) => (
                <div key={film.tmdb_id} className="shrink-0 w-36">
                  <FilmCard film={interactionToFilm(film)} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
