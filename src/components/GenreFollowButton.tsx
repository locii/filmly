"use client";

import { useState } from "react";
import { useGenreFollows } from "@/context/GenreFollowsContext";

interface Props {
  genreId: number;
  name: string;
}

export default function GenreFollowButton({ genreId, name }: Props) {
  const { isFollowingGenre, followGenre, unfollowGenre, isLoggedIn } = useGenreFollows();
  const [acting, setActing] = useState(false);

  if (!isLoggedIn) return null;

  const following = isFollowingGenre(genreId);

  async function toggle() {
    if (acting) return;
    setActing(true);
    try {
      if (following) await unfollowGenre(genreId);
      else await followGenre(genreId, name);
    } finally {
      setActing(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={acting}
      aria-pressed={following}
      title={following ? `Unfollow ${name}` : `Follow ${name}`}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50
        ${following
          ? "bg-amber-500 text-white hover:bg-amber-600"
          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}
    >
      <svg
        className="w-4 h-4"
        fill={following ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
      {following ? "Following" : "Follow"}
    </button>
  );
}
