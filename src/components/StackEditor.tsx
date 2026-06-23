"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TMDB_IMAGE_BASE } from "@/lib/tmdb";
import { useFavourites } from "@/context/FavouritesContext";
import { Film, TMDBResponse } from "@/lib/types";

function Poster({ path, alt }: { path: string | null; alt: string }) {
  return (
    <div className="aspect-[2/3] relative bg-zinc-800 rounded-md overflow-hidden">
      {path ? (
        <Image src={`${TMDB_IMAGE_BASE}/w342${path}`} alt={alt} fill className="object-cover" sizes="160px" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
        </div>
      )}
    </div>
  );
}

interface StackEditorProps {
  /** "create" publishes a new stack; "edit" updates an existing one. */
  mode: "create" | "edit";
  /** Required for "edit" — the slug of the stack being changed. */
  slug?: string;
  initialName?: string;
  initialFilms?: Film[];
}

export default function StackEditor({ mode, slug, initialName = "", initialFilms = [] }: StackEditorProps) {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useFavourites();
  const isEdit = mode === "edit";

  const [name, setName] = useState(initialName);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Film[]>([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<Film[]>(initialFilms);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pickedIds = new Set(picked.map((f) => f.id));

  // Debounced film search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = (await res.json()) as TMDBResponse<Film>;
        setResults((data.results ?? []).filter((f) => f?.id && f?.title));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const addFilm = (film: Film) => setPicked((prev) => (prev.some((f) => f.id === film.id) ? prev : [...prev, film]));
  const removeFilm = (id: number) => setPicked((prev) => prev.filter((f) => f.id !== id));

  const save = useCallback(async () => {
    if (saving || !name.trim() || picked.length === 0) return;
    setSaving(true);
    setError("");
    try {
      const endpoint = isEdit ? `/api/stacks/${slug}` : "/api/stacks";
      const res = await fetch(endpoint, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: name.trim(), films: picked, totalTitles: picked.length }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't save");
      router.push(`/stacks/${data.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save");
      setSaving(false);
    }
  }, [saving, name, picked, router, isEdit, slug]);

  if (!isLoading && !isLoggedIn) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-3">
        <h1 className="text-2xl font-bold text-white">Sign in to create a stack</h1>
        <p className="text-zinc-400">Use the “Sign in” button in the top bar, then come back to build and publish your stack.</p>
        <Link href="/stacks" className="inline-block text-amber-400 hover:text-amber-300 text-sm">← Back to stacks</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-amber-500 font-medium">{isEdit ? "Edit stack" : "New stack"}</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white">{isEdit ? "Edit stack" : "Create a stack"}</h1>
        <p className="text-zinc-400">Name it, hand-pick the films, then publish a shareable page.</p>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <label htmlFor="stack-name" className="block text-sm font-medium text-zinc-300">Stack name</label>
        <input
          id="stack-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Best heist films of all time"
          className="w-full max-w-xl bg-zinc-800/60 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
        />
      </div>

      {/* Picked films */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-semibold text-white">
            In this stack <span className="text-zinc-500 font-normal">· {picked.length}</span>
          </h2>
          <div className="flex items-center gap-3">
            {isEdit && (
              <Link href="/my-stacks" className="text-sm text-zinc-400 hover:text-white transition">
                Cancel
              </Link>
            )}
            <button
              type="button"
              onClick={save}
              disabled={saving || !name.trim() || picked.length === 0}
              className="bg-amber-500 hover:bg-amber-600 text-black text-sm font-semibold px-5 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {saving ? (isEdit ? "Saving…" : "Publishing…") : isEdit ? "Save changes" : "Publish stack"}
            </button>
          </div>
        </div>
        {error && <p className="text-amber-400 text-sm">{error}</p>}
        {picked.length === 0 ? (
          <p className="text-zinc-500 text-sm border border-dashed border-zinc-800 rounded-xl py-8 text-center">
            Search below and add films to build your stack.
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {picked.map((film) => (
              <div key={film.id} className="relative group">
                <Poster path={film.poster_path} alt={film.title} />
                <button
                  type="button"
                  onClick={() => removeFilm(film.id)}
                  aria-label={`Remove ${film.title}`}
                  className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-black/70 text-zinc-200 hover:bg-red-600 hover:text-white backdrop-blur-sm transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <p className="mt-1 text-xs text-zinc-400 line-clamp-1">{film.title}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="space-y-3 pt-2">
        <label htmlFor="film-search" className="block text-sm font-medium text-zinc-300">Add films</label>
        <input
          id="film-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title…"
          className="w-full max-w-xl bg-zinc-800/60 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
        />

        {searching && <p className="text-zinc-500 text-sm">Searching…</p>}

        {results.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {results.map((film) => {
              const added = pickedIds.has(film.id);
              return (
                <button
                  key={film.id}
                  type="button"
                  onClick={() => addFilm(film)}
                  disabled={added}
                  className="text-left group disabled:cursor-default"
                >
                  <div className="relative">
                    <Poster path={film.poster_path} alt={film.title} />
                    <div className={`absolute inset-0 rounded-md flex items-center justify-center transition-opacity ${added ? "bg-black/60 opacity-100" : "bg-black/40 opacity-0 group-hover:opacity-100"}`}>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${added ? "bg-green-600 text-white" : "bg-amber-500 text-black"}`}>
                        {added ? "✓ Added" : "+ Add"}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400 line-clamp-1">
                    {film.title}
                    {film.release_date && <span className="text-zinc-600"> · {film.release_date.slice(0, 4)}</span>}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
