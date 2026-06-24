"use client";

import Image from "next/image";
import Link from "next/link";
import { TMDB_IMAGE_BASE } from "@/lib/tmdb";
import { Film } from "@/lib/types";
import { useFavourites } from "@/context/FavouritesContext";
import { useState } from "react";

function slugify(title: string | null | undefined) {
  return (title ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative group/tip flex items-center justify-center">
      {children}
      <span className="pointer-events-none absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2
        whitespace-nowrap rounded bg-zinc-900 border border-zinc-700 text-zinc-200 text-[11px] px-2 py-0.5
        opacity-0 group-hover/tip:opacity-100 transition-opacity z-50 shadow-lg">
        {label}
      </span>
    </div>
  );
}

export default function FilmCard({ film, onRemove }: { film: Film; onRemove?: () => void }) {
  const { addInteraction, removeInteraction, getInteraction, isLoggedIn } = useFavourites();
  const [acting, setActing] = useState(false);

  const interactions = getInteraction(film.id);
  const onWatchlist = interactions.some((i) => i.interaction === "watchlist");
  const isWatched  = interactions.some((i) => i.interaction === "watched");
  const isLiked    = interactions.some((i) => i.interaction === "like");
  const isDisliked = interactions.some((i) => i.interaction === "dislike");

  const posterUrl = film.poster_path ? `${TMDB_IMAGE_BASE}/w500${film.poster_path}` : null;
  const year   = film.release_date?.slice(0, 4) ?? "";
  const rating = film.vote_average ? film.vote_average.toFixed(1) : "—";
  const genres = film.genre_ids ?? [];

  async function act(fn: () => Promise<void>) {
    if (acting) return;
    setActing(true);
    try { await fn(); } finally { setActing(false); }
  }

  const toggleWatchlist = () => act(async () => {
    if (onWatchlist) await removeInteraction(film.id, "watchlist");
    else await addInteraction(film.id, film.title, film.poster_path, "watchlist", genres);
  });

  const toggleWatched = () => act(async () => {
    if (isWatched) { await removeInteraction(film.id, "watched"); }
    else {
      // Marking watched clears the to-watch bookmark; re-bookmark later to rewatch.
      if (onWatchlist) await removeInteraction(film.id, "watchlist", { silent: true });
      await addInteraction(film.id, film.title, film.poster_path, "watched", genres);
    }
  });

  const toggleLike = () => act(async () => {
    if (isLiked) { await removeInteraction(film.id, "like"); }
    else {
      if (isDisliked) await removeInteraction(film.id, "dislike", { silent: true });
      await addInteraction(film.id, film.title, film.poster_path, "like", genres);
    }
  });

  const toggleDislike = () => act(async () => {
    if (isDisliked) { await removeInteraction(film.id, "dislike"); }
    else {
      if (isLiked) await removeInteraction(film.id, "like", { silent: true });
      await addInteraction(film.id, film.title, film.poster_path, "dislike", genres);
    }
  });

  const anyActive = onWatchlist || isWatched || isLiked || isDisliked;

  return (
    <div className="group relative rounded-lg overflow-hidden bg-zinc-900 transition-transform hover:scale-105 hover:z-10">
      {/* Poster region — holds the image and all overlay buttons */}
      <div className="relative">
        <Link href={`/films/${film.id}-${slugify(film.title)}`} className="block">
          <div className="aspect-[2/3] relative bg-zinc-800">
            {posterUrl ? (
              <Image src={posterUrl} alt={film.title} fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
              </div>
            )}
            <div className={`absolute top-2 ${onRemove ? "left-11" : "left-2"} bg-black/70 backdrop-blur-sm text-yellow-400 text-xs font-bold px-2 py-0.5 rounded pointer-events-none`}>
              ★ {rating}
            </div>
          </div>
        </Link>

        {/* Remove from stack — outside the Link so it doesn't navigate */}
        {onRemove && (
          <Tip label="Remove from stack">
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }}
              aria-label={`Remove ${film.title}`}
              className="absolute top-2 left-2 z-20 w-7 h-7 flex items-center justify-center rounded-full bg-black/70 text-zinc-200 hover:bg-red-600 hover:text-white backdrop-blur-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </Tip>
        )}

        {/* Action buttons overlay the poster only — outside the Link */}
        {isLoggedIn && (
          <>
            {/* Rewatch badge — bookmarked again after watching */}
            {onWatchlist && isWatched && (
              <div className="absolute top-2 left-2 mt-7 bg-amber-500/90 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded pointer-events-none flex items-center gap-0.5">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a8 8 0 0114-3m2 8a8 8 0 01-14 3" />
                </svg>
                Rewatch
              </div>
            )}

            {/* Watchlist — top right */}
            <div className="absolute top-2 right-2">
              <Tip label={
                onWatchlist
                  ? "Remove from watchlist"
                  : isWatched
                    ? "Add to watchlist to rewatch"
                    : "Add to watchlist"
              }>
                <button
                  onClick={toggleWatchlist}
                  disabled={acting}
                  className={`w-7 h-7 flex items-center justify-center rounded-full backdrop-blur-sm transition-all
                    ${onWatchlist
                      ? "bg-amber-500/90 text-white opacity-100"
                      : anyActive
                        ? "bg-black/60 text-zinc-300 opacity-100 hover:text-white hover:bg-black/80"
                        : "bg-black/60 text-zinc-300 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-black/80"}`}
                >
                  <svg className="w-4 h-4" fill={onWatchlist ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
              </Tip>
            </div>

            {/* Bottom row — watched / liked / disliked */}
            <div className={`absolute bottom-0 left-0 right-0 flex justify-center gap-2 p-2 bg-gradient-to-t from-black/80 to-transparent transition-opacity
              ${anyActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
              <Tip label={isWatched ? "Mark as unwatched" : "Mark as watched"}>
              <button onClick={toggleWatched} disabled={acting}
                className={`p-1.5 rounded-full backdrop-blur-sm transition-all
                  ${isWatched ? "bg-green-600/90 text-white" : "bg-black/50 text-zinc-300 hover:text-white"}`}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </Tip>
            <Tip label={isLiked ? "Remove recommendation" : "Recommend"}>
              <button onClick={toggleLike} disabled={acting}
                className={`p-1.5 rounded-full backdrop-blur-sm transition-all
                  ${isLiked ? "bg-amber-500/90 text-white" : "bg-black/50 text-zinc-300 hover:text-white"}`}>
                <svg className="w-3.5 h-3.5" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </button>
            </Tip>
            <Tip label={isDisliked ? "Remove" : "Don't recommend"}>
              <button onClick={toggleDislike} disabled={acting}
                className={`p-1.5 rounded-full backdrop-blur-sm transition-all
                  ${isDisliked ? "bg-zinc-500/90 text-white" : "bg-black/50 text-zinc-300 hover:text-white"}`}>
                <svg className="w-3.5 h-3.5" fill={isDisliked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                </svg>
              </button>
            </Tip>
          </div>
          </>
        )}
      </div>

      {/* Title sits below the poster, clear of the action buttons */}
      <Link href={`/films/${film.id}-${slugify(film.title)}`} className="block">
        <div className="p-3">
          <h3 className="text-sm font-semibold text-zinc-100 line-clamp-2 leading-snug">{film.title}</h3>
          {year && <p className="text-xs text-zinc-500 mt-0.5">{year}</p>}
          {film.reason && (
            <p className="text-[11px] text-brand/90 mt-1 line-clamp-1" title={film.reason}>
              {film.reason}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}
