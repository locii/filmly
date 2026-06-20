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

interface Props {
  film: Film;
}

export default function FilmCard({ film }: Props) {
  const { addInteraction, removeInteraction, getInteraction, isLoggedIn } = useFavourites();
  const [isActing, setIsActing] = useState(false);

  const interactions = getInteraction(film.id);
  const isSaved    = interactions.some((i) => i.interaction === "favourite");
  const isLiked    = interactions.some((i) => i.interaction === "like");
  const isDisliked = interactions.some((i) => i.interaction === "dislike");

  const posterUrl = film.poster_path
    ? `${TMDB_IMAGE_BASE}/w500${film.poster_path}`
    : null;

  const year   = film.release_date ? film.release_date.slice(0, 4) : "";
  const rating = film.vote_average ? film.vote_average.toFixed(1) : "—";

  async function toggleSave(e: React.MouseEvent) {
    e.preventDefault();
    if (!isLoggedIn || isActing) return;
    setIsActing(true);
    try {
      if (isSaved) {
        await removeInteraction(film.id, "favourite");
      } else {
        await addInteraction(film.id, film.title, film.poster_path, "favourite", film.genre_ids ?? []);
      }
    } finally {
      setIsActing(false);
    }
  }

  async function toggleLike(e: React.MouseEvent) {
    e.preventDefault();
    if (!isLoggedIn || isActing) return;
    setIsActing(true);
    try {
      if (isLiked) {
        await removeInteraction(film.id, "like");
      } else {
        // Remove dislike if present, then add like
        if (isDisliked) await removeInteraction(film.id, "dislike");
        await addInteraction(film.id, film.title, film.poster_path, "like", film.genre_ids ?? []);
      }
    } finally {
      setIsActing(false);
    }
  }

  async function toggleDislike(e: React.MouseEvent) {
    e.preventDefault();
    if (!isLoggedIn || isActing) return;
    setIsActing(true);
    try {
      if (isDisliked) {
        await removeInteraction(film.id, "dislike");
      } else {
        // Remove like if present, then add dislike
        if (isLiked) await removeInteraction(film.id, "like");
        await addInteraction(film.id, film.title, film.poster_path, "dislike", film.genre_ids ?? []);
      }
    } finally {
      setIsActing(false);
    }
  }

  return (
    <div className="group relative rounded-lg overflow-hidden bg-zinc-900 transition-transform hover:scale-105 hover:z-10">
      <Link href={`/films/${film.id}-${slugify(film.title)}`}>
        <div className="aspect-[2/3] relative bg-zinc-800">
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={film.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
          )}

          {/* Rating badge */}
          <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-yellow-400 text-xs font-bold px-2 py-0.5 rounded">
            ★ {rating}
          </div>

          {/* Save button (heart) — top right */}
          {isLoggedIn && (
            <button
              onClick={toggleSave}
              title={isSaved ? "Remove from saved" : "Save"}
              className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-sm transition-all
                ${isSaved
                  ? "bg-amber-500/90 text-white"
                  : "bg-black/50 text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-white"
                }`}
            >
              <svg className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          )}

          {/* Thumbs row — bottom, visible on hover */}
          {isLoggedIn && (
            <div className={`absolute bottom-0 left-0 right-0 flex justify-center gap-2 p-2 bg-gradient-to-t from-black/80 to-transparent transition-opacity
              ${isLiked || isDisliked ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
              <button
                onClick={toggleLike}
                title="Like"
                className={`p-1.5 rounded-full backdrop-blur-sm transition-all
                  ${isLiked ? "bg-green-500/90 text-white" : "bg-black/50 text-zinc-300 hover:text-white"}`}
              >
                <svg className="w-3.5 h-3.5" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </button>
              <button
                onClick={toggleDislike}
                title="Not for me"
                className={`p-1.5 rounded-full backdrop-blur-sm transition-all
                  ${isDisliked ? "bg-zinc-500/90 text-white" : "bg-black/50 text-zinc-300 hover:text-white"}`}
              >
                <svg className="w-3.5 h-3.5" fill={isDisliked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className="p-3">
          <h3 className="text-sm font-semibold text-zinc-100 line-clamp-2 leading-snug">
            {film.title}
          </h3>
          {year && <p className="text-xs text-zinc-500 mt-0.5">{year}</p>}
        </div>
      </Link>
    </div>
  );
}
