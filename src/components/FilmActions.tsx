"use client";

import { useState } from "react";
import { useFavourites } from "@/context/FavouritesContext";
import { useActiveStack } from "@/context/ActiveStackContext";
import { Film } from "@/lib/types";

function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative group/tip">
      {children}
      <span className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2
        whitespace-nowrap rounded bg-zinc-900 border border-zinc-700 text-zinc-200 text-[11px] px-2 py-0.5
        opacity-0 group-hover/tip:opacity-100 transition-opacity z-50 shadow-lg">
        {label}
      </span>
    </div>
  );
}

export default function FilmActions({ film }: { film: Film }) {
  const { addInteraction, removeInteraction, getInteraction, isLoggedIn } = useFavourites();
  const { activeStack, addToActiveStack, removeFromActiveStack, isInActiveStack } = useActiveStack();
  const [acting, setActing] = useState(false);

  const interactions = getInteraction(film.id);
  const onWatchlist = interactions.some((i) => i.interaction === "watchlist");
  const isWatched  = interactions.some((i) => i.interaction === "watched");
  const isLiked    = interactions.some((i) => i.interaction === "like");
  const isDisliked = interactions.some((i) => i.interaction === "dislike");
  const inStack    = !!activeStack && isInActiveStack(film.id);

  if (!isLoggedIn) return null;

  const genres = film.genre_ids ?? [];

  async function act(fn: () => Promise<void>) {
    if (acting) return;
    setActing(true);
    try { await fn(); } finally { setActing(false); }
  }

  return (
    <div className="flex items-center gap-0.5">
      {activeStack && (
        <Tip label={inStack ? `In “${activeStack.query}”` : `Add to “${activeStack.query}”`}>
          <button
            onClick={() => act(async () => {
              if (inStack) await removeFromActiveStack(film.id);
              else await addToActiveStack(film);
            })}
            disabled={acting}
            aria-pressed={inStack}
            className={`p-2 rounded-full transition-colors disabled:opacity-50
              ${inStack ? "text-amber-400 hover:text-amber-500" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={inStack ? 2.5 : 1.5}>
              {inStack
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />}
            </svg>
          </button>
        </Tip>
      )}

      <Tip label={
        onWatchlist
          ? "Remove from watchlist"
          : isWatched
            ? "Add to watchlist to rewatch"
            : "Add to watchlist"
      }>
        <button
          onClick={() => act(async () => {
            if (onWatchlist) await removeInteraction(film.id, "watchlist");
            else await addInteraction(film.id, film.title, film.poster_path, "watchlist", genres, film.release_date);
          })}
          disabled={acting}
          className={`p-2 rounded-full transition-colors disabled:opacity-50
            ${onWatchlist ? "text-amber-400 hover:text-amber-500" : "text-zinc-500 hover:text-zinc-300"}`}
        >
          <svg className="w-5 h-5" fill={onWatchlist ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </Tip>

      <Tip label={isWatched ? "Mark as unwatched" : "Mark as watched"}>
        <button
          onClick={() => act(async () => {
            if (isWatched) { await removeInteraction(film.id, "watched"); }
            else {
              // Marking watched clears the to-watch bookmark; re-bookmark later to rewatch.
              if (onWatchlist) await removeInteraction(film.id, "watchlist", { silent: true });
              await addInteraction(film.id, film.title, film.poster_path, "watched", genres, film.release_date);
            }
          })}
          disabled={acting}
          className={`p-2 rounded-full transition-colors disabled:opacity-50
            ${isWatched ? "text-green-400 hover:text-green-500" : "text-zinc-500 hover:text-zinc-300"}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isWatched ? 2.5 : 1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </Tip>

      <Tip label={isLiked ? "Remove recommendation" : "Recommend"}>
        <button
          onClick={() => act(async () => {
            if (isLiked) { await removeInteraction(film.id, "like"); }
            else {
              if (isDisliked) await removeInteraction(film.id, "dislike", { silent: true });
              await addInteraction(film.id, film.title, film.poster_path, "like", genres, film.release_date);
            }
          })}
          disabled={acting}
          className={`p-2 rounded-full transition-colors disabled:opacity-50
            ${isLiked ? "text-amber-400 hover:text-amber-500" : "text-zinc-500 hover:text-zinc-300"}`}
        >
          <svg className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
        </button>
      </Tip>

      <Tip label={isDisliked ? "Remove" : "Don't recommend"}>
        <button
          onClick={() => act(async () => {
            if (isDisliked) { await removeInteraction(film.id, "dislike"); }
            else {
              if (isLiked) await removeInteraction(film.id, "like", { silent: true });
              await addInteraction(film.id, film.title, film.poster_path, "dislike", genres, film.release_date);
            }
          })}
          disabled={acting}
          className={`p-2 rounded-full transition-colors disabled:opacity-50
            ${isDisliked ? "text-zinc-300 hover:text-zinc-400" : "text-zinc-500 hover:text-zinc-300"}`}
        >
          <svg className="w-5 h-5" fill={isDisliked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
          </svg>
        </button>
      </Tip>
    </div>
  );
}
