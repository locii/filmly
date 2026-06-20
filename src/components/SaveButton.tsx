"use client";

import { useState } from "react";
import { useFavourites } from "@/context/FavouritesContext";
import { Film } from "@/lib/types";

interface Props {
  film: Film;
}

export default function SaveButton({ film }: Props) {
  const { addInteraction, removeInteraction, getInteraction, isLoggedIn } = useFavourites();
  const [isActing, setIsActing] = useState(false);
  const isSaved = getInteraction(film.id).some((i) => i.interaction === "watchlist");

  if (!isLoggedIn) return null;

  async function toggleSave() {
    if (isActing) return;
    setIsActing(true);
    try {
      if (isSaved) {
        await removeInteraction(film.id, "watchlist");
      } else {
        await addInteraction(
          film.id,
          film.title,
          film.poster_path,
          "watchlist",
          film.genre_ids ?? []
        );
      }
    } finally {
      setIsActing(false);
    }
  }

  return (
    <button
      onClick={toggleSave}
      disabled={isActing}
      title={isSaved ? "Remove from saved" : "Save"}
      className={`p-2 rounded-full transition-colors disabled:opacity-50
        ${isSaved ? "text-brand hover:text-brand-dark" : "text-zinc-600 hover:text-zinc-300"}`}
    >
      <svg
        className="w-5 h-5"
        fill={isSaved ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </button>
  );
}
