"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Film, FollowedGenre } from "@/lib/types";
import { useGenreFollows } from "@/context/GenreFollowsContext";
import FilmCard from "./FilmCard";

// One followed genre: a header that links through to the full genre page, with a
// horizontal overflow row of popular films. Films are fetched lazily.
function GenreRow({ genre }: { genre: FollowedGenre }) {
  const { unfollowGenre } = useGenreFollows();
  const [films, setFilms] = useState<Film[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/genres/${genre.genre_id}/films`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setFilms((d.results ?? []).slice(0, 20));
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => { cancelled = true; };
  }, [genre.genre_id]);

  const href = `/genres/${genre.genre_id}`;

  return (
    <section className="border-b border-zinc-800/80 pb-8">
      <div className="flex items-center justify-between mb-4">
        <Link href={href} className="group">
          <h3 className="text-base font-semibold text-white group-hover:text-amber-400 transition-colors">
            {genre.name}
          </h3>
        </Link>

        <div className="flex items-center gap-3 shrink-0">
          <Link href={href} className="text-sm text-zinc-400 hover:text-white transition-colors">
            Browse all →
          </Link>
          <button
            onClick={() => unfollowGenre(genre.genre_id)}
            title={`Unfollow ${genre.name}`}
            className="text-amber-400 hover:text-zinc-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>
      </div>

      {films === null && !error ? (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shrink-0 w-36 sm:w-40 aspect-[2/3] rounded-lg bg-zinc-900 animate-pulse" />
          ))}
        </div>
      ) : error || (films && films.length === 0) ? (
        <p className="text-sm text-zinc-600">No films found.</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {films!.map((f) => (
            <div key={f.id} className="shrink-0 w-36 sm:w-40">
              <FilmCard film={f} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function FollowedGenres() {
  const { genreFollows, isLoading } = useGenreFollows();

  if (isLoading) {
    return <p className="text-zinc-500 text-sm">Loading…</p>;
  }

  if (genreFollows.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-zinc-400 text-base mb-2">You&apos;re not following any genres yet.</p>
        <p className="text-zinc-600 text-sm">
          Open a <Link href="/genres" className="text-amber-400 hover:underline">genre page</Link> and tap Follow.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {genreFollows.map((g) => <GenreRow key={g.genre_id} genre={g} />)}
    </div>
  );
}
