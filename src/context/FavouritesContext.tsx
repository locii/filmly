"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/context/ToastContext";
import { FilmInteraction, FilmRatings } from "@/lib/types";

type InteractionType = "like" | "dislike" | "watchlist" | "watched";

const ADD_TOAST: Record<InteractionType, { message: string; tone: "brand" | "green" | "yellow" | "red" }> = {
  watchlist: { message: "Added to watchlist", tone: "brand" },
  watched: { message: "Marked as watched", tone: "green" },
  like: { message: "Recommended", tone: "yellow" },
  dislike: { message: "Won't recommend", tone: "red" },
};

const REMOVE_TOAST: Record<InteractionType, string> = {
  watchlist: "Removed from watchlist",
  watched: "Removed from watched",
  like: "Recommendation removed",
  dislike: "Removed",
};

interface FavouritesContextType {
  interactions: FilmInteraction[];
  isLoading: boolean;
  addInteraction: (
    tmdbId: number,
    title: string,
    posterPath: string | null,
    type: "like" | "dislike" | "watchlist" | "watched",
    genreIds?: number[],
    releaseDate?: string | null
  ) => Promise<void>;
  removeInteraction: (
    tmdbId: number,
    type: InteractionType,
    opts?: { silent?: boolean }
  ) => Promise<void>;
  getInteraction: (tmdbId: number) => FilmInteraction[];
  // Toggle a watchlisted film in/out of the "Up Next" queue.
  toggleWatchNext: (tmdbId: number) => Promise<void>;
  // Persist a new queue order (ordered list of watchlisted tmdb_ids).
  reorderQueue: (orderedTmdbIds: number[]) => Promise<void>;
  // Write fetched release dates onto rows that don't have one yet (backfill of
  // films saved before the date was persisted).
  backfillReleaseDates: (ratings: FilmRatings) => Promise<void>;
  isLoggedIn: boolean;
}

const FavouritesContext = createContext<FavouritesContextType | null>(null);

export function FavouritesProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const { showToast } = useToast();
  const [interactions, setInteractions] = useState<FilmInteraction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const fetchInteractions = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoggedIn(false);
      setIsLoading(false);
      return;
    }
    setIsLoggedIn(true);
    const { data } = await supabase
      .from("film_interactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setInteractions((data as FilmInteraction[]) ?? []);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchInteractions();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchInteractions();
    });
    return () => subscription.unsubscribe();
  }, [fetchInteractions, supabase.auth]);

  const addInteraction = async (
    tmdbId: number,
    title: string,
    posterPath: string | null,
    type: "like" | "dislike" | "watchlist" | "watched",
    genreIds: number[] = [],
    releaseDate: string | null = null
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("film_interactions")
      .upsert(
        {
          user_id: user.id,
          tmdb_id: tmdbId,
          title,
          poster_path: posterPath,
          genre_ids: genreIds,
          release_date: releaseDate,
          interaction: type,
        },
        { onConflict: "user_id,tmdb_id,interaction" }
      )
      .select()
      .single();

    if (!error && data) {
      setInteractions((prev) => [
        data as FilmInteraction,
        ...prev.filter((i) => !(i.tmdb_id === tmdbId && i.interaction === type)),
      ]);
      const t = ADD_TOAST[type];
      showToast(t.message, t.tone);
    } else if (error) {
      showToast("Couldn't save — please try again", "red");
    }
  };

  const removeInteraction = async (
    tmdbId: number,
    type: InteractionType,
    opts?: { silent?: boolean }
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("film_interactions")
      .delete()
      .eq("user_id", user.id)
      .eq("tmdb_id", tmdbId)
      .eq("interaction", type);

    setInteractions((prev) =>
      prev.filter((i) => !(i.tmdb_id === tmdbId && i.interaction === type))
    );

    if (!opts?.silent) showToast(REMOVE_TOAST[type], "zinc");
  };

  const getInteraction = (tmdbId: number) =>
    interactions.filter((i) => i.tmdb_id === tmdbId);

  // Backfill release_date on rows that lack it, using freshly fetched ratings.
  // Makes the year durable so later loads don't depend on the ratings call.
  const backfillReleaseDates = async (ratings: FilmRatings) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const ids = [...new Set(
      interactions
        .filter((i) => !i.release_date && ratings[i.tmdb_id]?.release_date)
        .map((i) => i.tmdb_id)
    )];
    if (ids.length === 0) return;

    const results = await Promise.all(
      ids.map((id) =>
        supabase
          .from("film_interactions")
          .update({ release_date: ratings[id].release_date })
          .eq("user_id", user.id)
          .eq("tmdb_id", id)
      )
    );

    // If the column isn't there yet (migration not applied), bail without
    // touching local state so we don't show stale data.
    if (results.some((r) => r.error)) return;

    setInteractions((prev) =>
      prev.map((i) =>
        !i.release_date && ratings[i.tmdb_id]?.release_date
          ? { ...i, release_date: ratings[i.tmdb_id].release_date }
          : i
      )
    );
  };

  // Add/remove a watchlisted film from the "Up Next" queue. New entries go to
  // the end of the queue; removing simply clears its position.
  const toggleWatchNext = async (tmdbId: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const target = interactions.find(
      (i) => i.tmdb_id === tmdbId && i.interaction === "watchlist"
    );
    if (!target) return;

    const queued = target.queue_position != null;
    let nextPos: number | null;
    if (queued) {
      nextPos = null;
    } else {
      const max = interactions.reduce(
        (m, i) => (i.queue_position != null && i.queue_position > m ? i.queue_position : m),
        -1
      );
      nextPos = max + 1;
    }

    // Optimistic update.
    setInteractions((prev) =>
      prev.map((i) =>
        i.id === target.id ? { ...i, queue_position: nextPos } : i
      )
    );

    const { error } = await supabase
      .from("film_interactions")
      .update({ queue_position: nextPos })
      .eq("user_id", user.id)
      .eq("tmdb_id", tmdbId)
      .eq("interaction", "watchlist");

    if (error) {
      // Roll back on failure.
      setInteractions((prev) =>
        prev.map((i) =>
          i.id === target.id ? { ...i, queue_position: target.queue_position ?? null } : i
        )
      );
      showToast("Couldn't update Up Next — please try again", "red");
    } else {
      showToast(queued ? "Removed from Up Next" : "Added to Up Next", queued ? "zinc" : "brand");
    }
  };

  // Persist a new queue order. positions are reassigned 0..n-1 in array order.
  const reorderQueue = async (orderedTmdbIds: number[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const prev = interactions;
    const posById = new Map(orderedTmdbIds.map((id, idx) => [id, idx]));

    // Optimistic update.
    setInteractions((cur) =>
      cur.map((i) =>
        i.interaction === "watchlist" && posById.has(i.tmdb_id)
          ? { ...i, queue_position: posById.get(i.tmdb_id)! }
          : i
      )
    );

    const results = await Promise.all(
      orderedTmdbIds.map((id, idx) =>
        supabase
          .from("film_interactions")
          .update({ queue_position: idx })
          .eq("user_id", user.id)
          .eq("tmdb_id", id)
          .eq("interaction", "watchlist")
      )
    );

    if (results.some((r) => r.error)) {
      setInteractions(prev);
      showToast("Couldn't save the new order — please try again", "red");
    }
  };

  return (
    <FavouritesContext.Provider
      value={{
        interactions,
        isLoading,
        addInteraction,
        removeInteraction,
        getInteraction,
        toggleWatchNext,
        reorderQueue,
        backfillReleaseDates,
        isLoggedIn,
      }}
    >
      {children}
    </FavouritesContext.Provider>
  );
}

export function useFavourites() {
  const ctx = useContext(FavouritesContext);
  if (!ctx) throw new Error("useFavourites must be used within FavouritesProvider");
  return ctx;
}
