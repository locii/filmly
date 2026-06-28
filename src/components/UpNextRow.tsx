"use client";

import { useEffect, useRef, useState } from "react";
import { FilmInteraction, FilmRatings } from "@/lib/types";
import FilmCard from "./FilmCard";
import { interactionToFilm } from "./GenreRow";
import { useFavourites } from "@/context/FavouritesContext";

// The "Up Next" queue: a drag-to-reorder row of the films you want to watch
// next. Drag cards to reorder (desktop); use each card's ⚡ toggle to remove.
export default function UpNextRow({ films, ratings }: { films: FilmInteraction[]; ratings?: FilmRatings }) {
  const { toggleWatchNext, reorderQueue } = useFavourites();
  const [items, setItems] = useState<FilmInteraction[]>(films);
  const itemsRef = useRef<FilmInteraction[]>(films);
  const dragIndex = useRef<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);

  // Keep local order in sync with the source of truth when not mid-drag.
  useEffect(() => {
    if (dragIndex.current === null) {
      setItems(films);
      itemsRef.current = films;
    }
  }, [films]);

  function reorder(from: number, to: number) {
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      itemsRef.current = next;
      return next;
    });
  }

  function handleDragEnter(i: number) {
    const from = dragIndex.current;
    if (from === null || from === i) return;
    reorder(from, i);
    dragIndex.current = i;
  }

  function handleDrop() {
    dragIndex.current = null;
    setDragging(null);
    reorderQueue(itemsRef.current.map((f) => f.tmdb_id));
  }

  return (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-brand" fill="currentColor" viewBox="0 0 24 24">
          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <h2 className="text-lg font-semibold text-white">Up Next</h2>
        <span className="text-xs text-zinc-500">· drag to reorder</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {items.map((film, i) => (
          <div
            key={film.tmdb_id}
            draggable
            onDragStart={() => { dragIndex.current = i; setDragging(i); }}
            onDragEnter={() => handleDragEnter(i)}
            onDragOver={(e) => e.preventDefault()}
            onDragEnd={handleDrop}
            onDrop={handleDrop}
            className={`shrink-0 w-44 cursor-grab active:cursor-grabbing transition-opacity ${
              dragging === i ? "opacity-40" : "opacity-100"
            }`}
          >
            <div className="relative">
              {/* Order badge — top-center to clear the ⚡ and bookmark toggles */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-30 min-w-6 h-6 px-2 flex items-center justify-center rounded-full bg-brand text-white text-xs font-bold shadow-lg pointer-events-none">
                {i + 1}
              </div>
              <FilmCard
                film={interactionToFilm(film, ratings)}
                queue={{ inQueue: true, onToggle: () => toggleWatchNext(film.tmdb_id) }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
