"use client";

import { useState } from "react";
import { FilmInteraction, Film, FilmRatings } from "@/lib/types";
import FilmCard from "./FilmCard";
import { useFavourites } from "@/context/FavouritesContext";

export function interactionToFilm(i: FilmInteraction, ratings?: FilmRatings): Film {
  const r = ratings?.[i.tmdb_id];
  return {
    id: i.tmdb_id,
    title: i.title,
    poster_path: i.poster_path,
    backdrop_path: null,
    overview: "",
    // Prefer the persisted date; fall back to the ratings backfill for older rows.
    release_date: i.release_date || r?.release_date || "",
    vote_average: r?.vote_average ?? 0,
    vote_count: 0,
    genre_ids: i.genre_ids,
  };
}

interface Props {
  genreId: number;
  genreName: string;
  films: FilmInteraction[];
  // When true, saved films get an "Up Next" toggle (watchlist only).
  enableQueue?: boolean;
  ratings?: FilmRatings;
}

type Status = "idle" | "loading" | "loaded" | "empty" | "error";

export default function GenreRow({ genreId, genreName, films, enableQueue, ratings }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [suggestions, setSuggestions] = useState<Film[]>([]);
  const { toggleWatchNext } = useFavourites();

  const savedIds = films.map((f) => f.tmdb_id);

  async function loadSuggestions() {
    if (status === "loading") return;
    setStatus("loading");

    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saved: savedIds }),
      });
      const data = await res.json();
      const results: Film[] = (data.results ?? []).filter(
        (f: Film) => !savedIds.includes(f.id)
      );
      setSuggestions(results.slice(0, 20));
      setStatus(results.length === 0 ? "empty" : "loaded");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-white">{genreName}</h2>
        <div className="flex items-center gap-3">
          <a
            href={`/genres/${genreId}`}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Browse all →
          </a>
          {status !== "loaded" && (
            <button
              onClick={loadSuggestions}
              disabled={status === "loading"}
              className="text-xs bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 px-3 py-1 rounded-full transition-colors"
            >
              {status === "loading" ? "Finding…" : status === "error" ? "Try again" : "✦ Discover more"}
            </button>
          )}
        </div>
      </div>

      {/* Saved films */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {films.map((film) => (
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

      {/* Suggestions */}
      {status === "loaded" && suggestions.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Suggested for you</p>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {suggestions.map((film) => (
              <div key={film.id} className="shrink-0 w-48">
                <FilmCard film={film} />
              </div>
            ))}
          </div>
        </div>
      )}

      {status === "empty" && (
        <p className="text-xs text-zinc-600 mt-2">No new suggestions found for this genre.</p>
      )}
    </section>
  );
}
