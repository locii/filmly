"use client";

import { useState } from "react";
import { useFavourites } from "@/context/FavouritesContext";
import { Film } from "@/lib/types";

interface Props {
  film: Film;
}

export default function FilmActions({ film }: Props) {
  const { addInteraction, removeInteraction, getInteraction, isLoggedIn } = useFavourites();
  const [isActing, setIsActing] = useState(false);

  const interactions = getInteraction(film.id);
  const isSaved    = interactions.some((i) => i.interaction === "favourite");
  const isLiked    = interactions.some((i) => i.interaction === "like");
  const isDisliked = interactions.some((i) => i.interaction === "dislike");

  if (!isLoggedIn) return null;

  const genreIds = film.genre_ids ?? [];

  async function act(fn: () => Promise<void>) {
    if (isActing) return;
    setIsActing(true);
    try { await fn(); } finally { setIsActing(false); }
  }

  function toggleSave() {
    return act(async () => {
      if (isSaved) await removeInteraction(film.id, "favourite");
      else await addInteraction(film.id, film.title, film.poster_path, "favourite", genreIds);
    });
  }

  function toggleLike() {
    return act(async () => {
      if (isLiked) {
        await removeInteraction(film.id, "like");
      } else {
        if (isDisliked) await removeInteraction(film.id, "dislike");
        await addInteraction(film.id, film.title, film.poster_path, "like", genreIds);
      }
    });
  }

  function toggleDislike() {
    return act(async () => {
      if (isDisliked) {
        await removeInteraction(film.id, "dislike");
      } else {
        if (isLiked) await removeInteraction(film.id, "like");
        await addInteraction(film.id, film.title, film.poster_path, "dislike", genreIds);
      }
    });
  }

  return (
    <div className="flex items-center gap-1">
      {/* Save */}
      <button
        onClick={toggleSave}
        disabled={isActing}
        title={isSaved ? "Remove from saved" : "Save"}
        className={`p-2 rounded-full transition-colors disabled:opacity-50
          ${isSaved ? "text-amber-400 hover:text-amber-500" : "text-zinc-500 hover:text-zinc-300"}`}
      >
        <svg className="w-5 h-5" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>

      {/* Thumbs up */}
      <button
        onClick={toggleLike}
        disabled={isActing}
        title="Like"
        className={`p-2 rounded-full transition-colors disabled:opacity-50
          ${isLiked ? "text-green-400 hover:text-green-500" : "text-zinc-500 hover:text-zinc-300"}`}
      >
        <svg className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        </svg>
      </button>

      {/* Thumbs down */}
      <button
        onClick={toggleDislike}
        disabled={isActing}
        title="Not for me"
        className={`p-2 rounded-full transition-colors disabled:opacity-50
          ${isDisliked ? "text-zinc-300 hover:text-zinc-400" : "text-zinc-500 hover:text-zinc-300"}`}
      >
        <svg className="w-5 h-5" fill={isDisliked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
        </svg>
      </button>
    </div>
  );
}
