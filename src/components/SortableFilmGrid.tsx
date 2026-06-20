"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import FilmCard from "./FilmCard";
import { Film } from "@/lib/types";

type SortKey = "default" | "az" | "za" | "rating" | "newest" | "oldest";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "default", label: "Default"   },
  { key: "rating",  label: "Top rated" },
  { key: "newest",  label: "Newest"    },
  { key: "oldest",  label: "Oldest"    },
  { key: "az",      label: "A – Z"     },
  { key: "za",      label: "Z – A"     },
];

function sortFilms(films: Film[], key: SortKey): Film[] {
  const copy = [...films];
  switch (key) {
    case "az":     return copy.sort((a, b) => a.title.localeCompare(b.title));
    case "za":     return copy.sort((a, b) => b.title.localeCompare(a.title));
    case "rating": return copy.sort((a, b) => b.vote_average - a.vote_average);
    case "newest": return copy.sort((a, b) => (b.release_date ?? "").localeCompare(a.release_date ?? ""));
    case "oldest": return copy.sort((a, b) => (a.release_date ?? "").localeCompare(b.release_date ?? ""));
    default:       return copy;
  }
}

interface Props {
  films: Film[];
  emptyMessage?: string;
  isStreaming?: boolean;   // true while discover is still loading more films
  totalTitles?: number;    // how many titles Claude suggested (for streaming count)
  // For API-backed pagination — pass these to enable "Load more" via API
  totalPages?: number;
  currentPage?: number;
  fetchPage?: (page: number) => Promise<Film[]>;
}

const PAGE_SIZE = 20;

export default function SortableFilmGrid({
  films: initialFilms,
  emptyMessage = "No films found.",
  isStreaming = false,
  totalTitles,
  totalPages,
  currentPage = 1,
  fetchPage,
}: Props) {
  const [allFilms, setAllFilms] = useState<Film[]>(initialFilms);
  const seenIds = useRef(new Set(initialFilms.map((f) => f.id)));

  // Append newly streamed films without resetting sort or visible page
  useEffect(() => {
    const incoming = initialFilms.filter((f) => !seenIds.current.has(f.id));
    if (incoming.length > 0) {
      incoming.forEach((f) => seenIds.current.add(f.id));
      setAllFilms((prev) => [...prev, ...incoming]);
    }
  }, [initialFilms]);
  const [sort, setSort] = useState<SortKey>("default");
  // For in-memory pagination (no fetchPage)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  // For API pagination
  const [page, setPage] = useState(currentPage);
  const [loadingMore, setLoadingMore] = useState(false);

  const sorted = useMemo(() => sortFilms(allFilms, sort), [allFilms, sort]);

  // What's actually shown depends on whether we're doing API or in-memory pagination
  const isApiMode = !!fetchPage;
  const displayed = isApiMode ? sorted : sorted.slice(0, visibleCount);
  const hasMoreInMemory = !isApiMode && visibleCount < sorted.length;
  const hasMoreApi = isApiMode && totalPages !== undefined && page < totalPages;

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      if (isApiMode && fetchPage) {
        const nextPage = page + 1;
        const newFilms = await fetchPage(nextPage);
        setAllFilms((prev) => {
          const existingIds = new Set(prev.map((f) => f.id));
          return [...prev, ...newFilms.filter((f) => !existingIds.has(f.id))];
        });
        setPage(nextPage);
      } else {
        setVisibleCount((c) => c + PAGE_SIZE);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, isApiMode, fetchPage, page]);

  if (allFilms.length === 0) {
    return <div className="text-center text-zinc-500 py-16 text-sm">{emptyMessage}</div>;
  }

  return (
    <div>
      {/* Sort bar */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <span className="text-xs text-zinc-500 mr-1">Sort:</span>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => {
              setSort(opt.key);
              if (!isApiMode) setVisibleCount(PAGE_SIZE);
            }}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${
              sort === opt.key
                ? "bg-zinc-700 text-white"
                : "bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-700"
            }`}
          >
            {opt.label}
          </button>
        ))}
        <span className="text-xs text-zinc-600 ml-auto flex items-center gap-1.5">
          {isApiMode ? allFilms.length : Math.min(visibleCount, sorted.length)} of{" "}
          {isStreaming ? (
            <>
              <span className="text-zinc-500">{sorted.length}</span>
              <span className="text-zinc-600">
                {totalTitles ? `(finding more of ~${totalTitles})` : "loading…"}
              </span>
            </>
          ) : (
            <>{sorted.length}{isApiMode && hasMoreApi ? "+" : ""}</>
          )}{" "}
          films{isStreaming && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          )}
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {displayed.map((film) => (
          <FilmCard key={film.id} film={film} />
        ))}
      </div>

      {/* Load more */}
      {(hasMoreInMemory || hasMoreApi) && (
        <div className="mt-10 text-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 text-sm px-6 py-2.5 rounded-lg transition-colors"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
