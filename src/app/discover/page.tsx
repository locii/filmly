"use client";

import { useState, useRef, useEffect } from "react";
import SortableFilmGrid from "@/components/SortableFilmGrid";
import { Film } from "@/lib/types";

const EXAMPLES = [
  "A gritty noir film with an anti-hero arc",
  "Feel-good 80s adventure for the whole family",
  "Mind-bending sci-fi like Inception",
  "Dark psychological thriller set in Europe",
  "Funny but heartwarming coming-of-age story",
];

interface ParsedInfo {
  genre_ids: number[];
  keywords: string[];
  keyword_ids: number[];
}

export default function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [films, setFilms] = useState<Film[]>([]);
  const [parsed, setParsed] = useState<ParsedInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent | null, overrideQuery?: string) {
    e?.preventDefault();
    const q = overrideQuery ?? query;
    if (!q.trim() || loading) return;

    if (overrideQuery) setQuery(overrideQuery);
    setLoading(true);
    setError("");
    setFilms([]);
    setParsed(null);
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
      setParsed(data.parsed ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-white">Find your next film</h1>
        <p className="text-zinc-400">Describe what you&apos;re in the mood for — Claude will find it.</p>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
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
            className="w-full bg-zinc-800/60 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 resize-none focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition text-sm sm:text-base pr-24"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-3 bottom-3 bg-brand hover:bg-brand-dark text-black text-sm font-semibold px-4 py-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {loading ? "…" : "Search"}
          </button>
        </div>

        {/* Example chips */}
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

      {/* Error */}
      {error && (
        <p className="text-red-400 text-sm text-center">{error}</p>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-12">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">Searching for films…</p>
        </div>
      )}

      {/* Results */}
      {!loading && films.length > 0 && (
        <div className="space-y-4">
          {parsed?.keywords?.length ? (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-zinc-500 text-xs">Matched:</span>
              {parsed.keywords.map((kw, i) => (
                <span key={i} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">
                  {kw}
                </span>
              ))}
            </div>
          ) : null}
          <SortableFilmGrid films={films} emptyMessage="No films found — try rephrasing your search." />
        </div>
      )}

      {/* No results */}
      {!loading && submitted && films.length === 0 && !error && (
        <div className="text-center py-12">
          <p className="text-zinc-400">No films found. Try a different description.</p>
        </div>
      )}
    </div>
  );
}
