"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/context/ToastContext";
import { Film } from "@/lib/types";

export interface ActiveStack {
  slug: string;
  query: string;            // the stack's display name
  films: Film[];            // snapshot of Film[] in display order
  created_at: string;
}

// Remembers which stack the user is building, across pages and reloads.
const STORAGE_KEY = "filmstack:active-stack";

interface ActiveStackContextType {
  stacks: ActiveStack[];
  activeStack: ActiveStack | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  setActiveSlug: (slug: string | null) => void;
  /** Create a new (empty) stack and make it active. Returns it, or null on failure. */
  createStack: (name: string) => Promise<ActiveStack | null>;
  addToActiveStack: (film: Film) => Promise<void>;
  removeFromActiveStack: (filmId: number) => Promise<void>;
  isInActiveStack: (filmId: number) => boolean;
}

const ActiveStackContext = createContext<ActiveStackContextType | null>(null);

// Reduce a full Film (or FilmDetail) to the fields a stack snapshot stores.
function toSnapshot(film: Film): Film {
  return {
    id: film.id,
    title: film.title,
    overview: film.overview ?? "",
    poster_path: film.poster_path ?? null,
    backdrop_path: film.backdrop_path ?? null,
    release_date: film.release_date ?? "",
    vote_average: film.vote_average ?? 0,
    vote_count: film.vote_count ?? 0,
    genre_ids: film.genre_ids ?? [],
  };
}

export function ActiveStackProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const { showToast } = useToast();
  const [stacks, setStacks] = useState<ActiveStack[]>([]);
  const [activeSlug, setActiveSlugState] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Always-fresh view of stacks for async mutations (avoids clobbering on
  // back-to-back adds that each capture stale state).
  const stacksRef = useRef<ActiveStack[]>([]);
  useEffect(() => { stacksRef.current = stacks; }, [stacks]);

  const setActiveSlug = useCallback((slug: string | null) => {
    setActiveSlugState(slug);
    try {
      if (slug) localStorage.setItem(STORAGE_KEY, slug);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* private mode / storage disabled — fall back to in-memory only */
    }
  }, []);

  const fetchStacks = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoggedIn(false);
      setStacks([]);
      setActiveSlugState(null);
      setIsLoading(false);
      return;
    }
    setIsLoggedIn(true);
    const { data } = await supabase
      .from("published_stacks")
      .select("slug, query, films, created_at")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });
    const rows = (data as ActiveStack[] | null) ?? [];
    setStacks(rows);

    // Restore the remembered active stack; fall back to the most recent one.
    let stored: string | null = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch { /* ignore */ }
    const valid = stored && rows.some((s) => s.slug === stored)
      ? stored
      : rows[0]?.slug ?? null;
    setActiveSlugState(valid);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchStacks();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => fetchStacks());
    return () => subscription.unsubscribe();
  }, [fetchStacks, supabase.auth]);

  const activeStack = stacks.find((s) => s.slug === activeSlug) ?? null;

  // Persist a stack's films via the owner-only PATCH endpoint.
  const persist = useCallback(async (slug: string, name: string, films: Film[]) => {
    const res = await fetch(`/api/stacks/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: name, films, totalTitles: films.length }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Couldn't update stack");
    }
  }, []);

  const createStack = useCallback(async (name: string): Promise<ActiveStack | null> => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    try {
      const res = await fetch("/api/stacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, films: [], totalTitles: 0 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't create stack");
      const stack: ActiveStack = {
        slug: data.slug,
        query: trimmed,
        films: [],
        created_at: new Date().toISOString(),
      };
      setStacks((prev) => [stack, ...prev]);
      setActiveSlug(stack.slug);
      showToast(`Created “${trimmed}”`, "brand");
      return stack;
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't create stack", "red");
      return null;
    }
  }, [setActiveSlug, showToast]);

  const addToActiveStack = useCallback(async (film: Film) => {
    const current = stacksRef.current.find((s) => s.slug === activeSlug);
    if (!current) {
      showToast("Pick a stack first", "zinc");
      return;
    }
    if (current.films.some((f) => f.id === film.id)) {
      showToast(`Already in “${current.query}”`, "zinc");
      return;
    }
    const nextFilms = [...current.films, toSnapshot(film)];
    // Optimistic update.
    setStacks((prev) => prev.map((s) => (s.slug === current.slug ? { ...s, films: nextFilms } : s)));
    try {
      await persist(current.slug, current.query, nextFilms);
      showToast(`Added to “${current.query}”`, "brand");
    } catch (err) {
      // Roll back.
      setStacks((prev) => prev.map((s) => (s.slug === current.slug ? { ...s, films: current.films } : s)));
      showToast(err instanceof Error ? err.message : "Couldn't add to stack", "red");
    }
  }, [activeSlug, persist, showToast]);

  const removeFromActiveStack = useCallback(async (filmId: number) => {
    const current = stacksRef.current.find((s) => s.slug === activeSlug);
    if (!current || !current.films.some((f) => f.id === filmId)) return;
    const nextFilms = current.films.filter((f) => f.id !== filmId);
    setStacks((prev) => prev.map((s) => (s.slug === current.slug ? { ...s, films: nextFilms } : s)));
    try {
      await persist(current.slug, current.query, nextFilms);
      showToast(`Removed from “${current.query}”`, "zinc");
    } catch (err) {
      setStacks((prev) => prev.map((s) => (s.slug === current.slug ? { ...s, films: current.films } : s)));
      showToast(err instanceof Error ? err.message : "Couldn't remove from stack", "red");
    }
  }, [activeSlug, persist, showToast]);

  const isInActiveStack = useCallback(
    (filmId: number) => !!activeStack?.films.some((f) => f.id === filmId),
    [activeStack],
  );

  return (
    <ActiveStackContext.Provider
      value={{
        stacks,
        activeStack,
        isLoggedIn,
        isLoading,
        setActiveSlug,
        createStack,
        addToActiveStack,
        removeFromActiveStack,
        isInActiveStack,
      }}
    >
      {children}
    </ActiveStackContext.Provider>
  );
}

export function useActiveStack() {
  const ctx = useContext(ActiveStackContext);
  if (!ctx) throw new Error("useActiveStack must be used within ActiveStackProvider");
  return ctx;
}
