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
import { FollowedGenre } from "@/lib/types";

interface GenreFollowsContextType {
  genreFollows: FollowedGenre[];
  isLoading: boolean;
  isLoggedIn: boolean;
  isFollowingGenre: (genreId: number) => boolean;
  followGenre: (genreId: number, name: string) => Promise<void>;
  unfollowGenre: (genreId: number) => Promise<void>;
}

const GenreFollowsContext = createContext<GenreFollowsContextType | null>(null);

export function GenreFollowsProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const { showToast } = useToast();
  const [genreFollows, setGenreFollows] = useState<FollowedGenre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const fetchFollows = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoggedIn(false);
      setIsLoading(false);
      return;
    }
    setIsLoggedIn(true);
    const { data } = await supabase
      .from("followed_genres")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setGenreFollows((data as FollowedGenre[]) ?? []);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchFollows();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchFollows();
    });
    return () => subscription.unsubscribe();
  }, [fetchFollows, supabase.auth]);

  const isFollowingGenre = (genreId: number) =>
    genreFollows.some((g) => g.genre_id === genreId);

  const followGenre = async (genreId: number, name: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("followed_genres")
      .upsert(
        { user_id: user.id, genre_id: genreId, name },
        { onConflict: "user_id,genre_id" }
      )
      .select()
      .single();

    if (!error && data) {
      setGenreFollows((prev) => [
        data as FollowedGenre,
        ...prev.filter((g) => g.genre_id !== genreId),
      ]);
      showToast(`Following ${name}`, "brand");
    } else if (error) {
      showToast("Couldn't follow — please try again", "red");
    }
  };

  const unfollowGenre = async (genreId: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const existing = genreFollows.find((g) => g.genre_id === genreId);

    await supabase
      .from("followed_genres")
      .delete()
      .eq("user_id", user.id)
      .eq("genre_id", genreId);

    setGenreFollows((prev) => prev.filter((g) => g.genre_id !== genreId));
    showToast(existing ? `Unfollowed ${existing.name}` : "Unfollowed", "zinc");
  };

  return (
    <GenreFollowsContext.Provider
      value={{ genreFollows, isLoading, isLoggedIn, isFollowingGenre, followGenre, unfollowGenre }}
    >
      {children}
    </GenreFollowsContext.Provider>
  );
}

export function useGenreFollows() {
  const ctx = useContext(GenreFollowsContext);
  if (!ctx) throw new Error("useGenreFollows must be used within GenreFollowsProvider");
  return ctx;
}
