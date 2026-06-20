"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SortableFilmGrid from "@/components/SortableFilmGrid";
import { Film } from "@/lib/types";

const EXAMPLES = [
  "A gritty noir film with an anti-hero arc",
  "Feel-good 80s adventure for the whole family",
  "Mind-bending sci-fi like Inception",
  "Dark psychological thriller set in Europe",
  "Funny but heartwarming coming-of-age story",
];

export default function DiscoverPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim() || loading) return;
    setLoading(true);
    setError("");
    setFilms([]);
    setSubmitted(true);

    try {
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setFilms(data.films ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // Auto-run if there's a query in the URL on first load
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      runSearch(q);
    } else {
      inputRef.current?.focus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent | null, overrideQuery?: string) {
    e?.preventDefault();
    const q = overrideQuery ?? query;
    if (!q.trim()) return;
    if (overrideQuery) setQuery(overrideQuery);
    // Push query to URL for shareability
    router.push(`/discover?q=${encodeURIComponent(q.trim())}`, { scroll: false });
    await runSearch(q);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-white">Find your next film</h1>
        <p className="text-zinc-400">Describe what you&apos;re in the mood for — Claude will find it.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(null);
            }
          }}
          rows={2}
          placeholder="I want to watch a gritty noir film with an anti-hero arc…"
          className="w-full bg-zinc-800/60 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 resize-none focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition text-sm sm:text-base"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-amber-500 hover:bg-amber-600 text-black text-sm font-semibold px-5 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {loading ? "Searching…" : "Find films"}
          </button>
        </div>

        {!submitted && (
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => handleSubmit(null, ex)}
                className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-full border border-zinc-700 transition"
              >
                {ex}
              </button>
            ))}
          </div>
        )}
      </form>

      {error && <p className="text-amber-400 text-sm">{error}</p>}

      {loading && (
        <div className="flex flex-col items-center gap-3 py-12">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">Searching for films…</p>
        </div>
      )}

      {!loading && films.length > 0 && (
        <SortableFilmGrid films={films} emptyMessage="No films found — try rephrasing your search." />
      )}

      {!loading && submitted && films.length === 0 && !error && (
        <div className="text-center py-12">
          <p className="text-zinc-400">No films found. Try a different description.</p>
        </div>
      )}
    </div>
  );
}
