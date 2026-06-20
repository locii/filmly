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
import { FilmInteraction } from "@/lib/types";

interface FavouritesContextType {
  interactions: FilmInteraction[];
  isLoading: boolean;
  addInteraction: (
    tmdbId: number,
    title: string,
    posterPath: string | null,
    type: "like" | "dislike" | "favourite",
    genreIds?: number[]
  ) => Promise<void>;
  removeInteraction: (tmdbId: number, type: "like" | "dislike" | "favourite") => Promise<void>;
  getInteraction: (tmdbId: number) => FilmInteraction[];
  isLoggedIn: boolean;
}

const FavouritesContext = createContext<FavouritesContextType | null>(null);

export function FavouritesProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
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
    type: "like" | "dislike" | "favourite",
    genreIds: number[] = []
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
    }
  };

  const removeInteraction = async (
    tmdbId: number,
    type: "like" | "dislike" | "favourite"
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
  };

  const getInteraction = (tmdbId: number) =>
    interactions.filter((i) => i.tmdb_id === tmdbId);

  return (
    <FavouritesContext.Provider
      value={{
        interactions,
        isLoading,
        addInteraction,
        removeInteraction,
        getInteraction,
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
