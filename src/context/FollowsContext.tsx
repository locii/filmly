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
import { FollowedPerson } from "@/lib/types";

interface FollowsContextType {
  follows: FollowedPerson[];
  isLoading: boolean;
  isLoggedIn: boolean;
  isFollowing: (personId: number) => boolean;
  follow: (
    personId: number,
    name: string,
    profilePath: string | null,
    knownForDepartment?: string | null
  ) => Promise<void>;
  unfollow: (personId: number) => Promise<void>;
}

const FollowsContext = createContext<FollowsContextType | null>(null);

export function FollowsProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const { showToast } = useToast();
  const [follows, setFollows] = useState<FollowedPerson[]>([]);
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
      .from("followed_people")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setFollows((data as FollowedPerson[]) ?? []);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchFollows();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchFollows();
    });
    return () => subscription.unsubscribe();
  }, [fetchFollows, supabase.auth]);

  const isFollowing = (personId: number) =>
    follows.some((f) => f.person_id === personId);

  const follow = async (
    personId: number,
    name: string,
    profilePath: string | null,
    knownForDepartment: string | null = null
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("followed_people")
      .upsert(
        {
          user_id: user.id,
          person_id: personId,
          name,
          profile_path: profilePath,
          known_for_department: knownForDepartment,
        },
        { onConflict: "user_id,person_id" }
      )
      .select()
      .single();

    if (!error && data) {
      setFollows((prev) => [
        data as FollowedPerson,
        ...prev.filter((f) => f.person_id !== personId),
      ]);
      showToast(`Following ${name}`, "brand");
    } else if (error) {
      showToast("Couldn't follow — please try again", "red");
    }
  };

  const unfollow = async (personId: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const existing = follows.find((f) => f.person_id === personId);

    await supabase
      .from("followed_people")
      .delete()
      .eq("user_id", user.id)
      .eq("person_id", personId);

    setFollows((prev) => prev.filter((f) => f.person_id !== personId));
    showToast(existing ? `Unfollowed ${existing.name}` : "Unfollowed", "zinc");
  };

  return (
    <FollowsContext.Provider
      value={{ follows, isLoading, isLoggedIn, isFollowing, follow, unfollow }}
    >
      {children}
    </FollowsContext.Provider>
  );
}

export function useFollows() {
  const ctx = useContext(FollowsContext);
  if (!ctx) throw new Error("useFollows must be used within FollowsProvider");
  return ctx;
}
