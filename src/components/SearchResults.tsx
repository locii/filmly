"use client";

import { useState, useCallback } from "react";
import SortableFilmGrid from "./SortableFilmGrid";
import { Film } from "@/lib/types";

interface Props {
  initialFilms: Film[];
  initialTotal: number;
  initialPages: number;
  query: string;
}

export default function SearchResults({ initialFilms, initialTotal, initialPages, query }: Props) {
  const [allFilms, setAllFilms] = useState<Film[]>(initialFilms);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const hasMore = page < initialPages;

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&page=${page + 1}`);
      const data = await res.json();
      const newFilms: Film[] = (data.results ?? []).filter((f: Film) => !!f?.id && !!f?.title);
      setAllFilms((prev) => {
        const seen = new Set(prev.map((f) => f.id));
        return [...prev, ...newFilms.filter((f) => !seen.has(f.id))];
      });
      setPage((p) => p + 1);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, query, page]);

  return (
    <div>
      {initialTotal > 0 && (
        <p className="text-zinc-500 text-sm mb-4">{initialTotal.toLocaleString()} films found</p>
      )}
      <SortableFilmGrid
        films={allFilms}
        emptyMessage={`No films found for "${query}".`}
      />
      {hasMore && (
        <div className="mt-10 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 text-sm px-6 py-2.5 rounded-lg transition-colors"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
