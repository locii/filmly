"use client";

import Image from "next/image";
import Link from "next/link";
import { TMDB_IMAGE_BASE } from "@/lib/tmdb";
import { Film } from "@/lib/types";
import { useFavourites } from "@/context/FavouritesContext";
import { useState } from "react";

function slugify(title: string) {
  return title
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
  const isSaved = getInteraction(film.id).some((i) => i.interaction === "favourite");

  const posterUrl = film.poster_path
    ? `${TMDB_IMAGE_BASE}/w500${film.poster_path}`
    : null;

  const year = film.release_date ? film.release_date.slice(0, 4) : "";
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

          {/* Save button */}
          {isLoggedIn && (
            <button
              onClick={toggleSave}
              title={isSaved ? "Remove from saved" : "Save"}
              className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-sm transition-all
                ${isSaved
                  ? "bg-brand/90 text-white"
                  : "bg-black/50 text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-white"
                }`}
            >
              <svg className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
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
