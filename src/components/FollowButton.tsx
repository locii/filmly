"use client";

import { useState } from "react";
import { useFollows } from "@/context/FollowsContext";

interface Props {
  personId: number;
  name: string;
  profilePath: string | null;
  knownForDepartment?: string | null;
  // "icon" — bare bookmark button (inline next to a name).
  // "pill" — icon + label, for prominent placement (person page header).
  variant?: "icon" | "pill";
}

export default function FollowButton({
  personId,
  name,
  profilePath,
  knownForDepartment = null,
  variant = "icon",
}: Props) {
  const { isFollowing, follow, unfollow, isLoggedIn } = useFollows();
  const [acting, setActing] = useState(false);

  if (!isLoggedIn) return null;

  const following = isFollowing(personId);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (acting) return;
    setActing(true);
    try {
      if (following) await unfollow(personId);
      else await follow(personId, name, profilePath, knownForDepartment);
    } finally {
      setActing(false);
    }
  }

  const icon = (
    <svg
      className={variant === "pill" ? "w-4 h-4" : "w-5 h-5"}
      fill={following ? "currentColor" : "none"}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );

  if (variant === "pill") {
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
        {icon}
        {following ? "Following" : "Follow"}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={acting}
      aria-pressed={following}
      title={following ? `Unfollow ${name}` : `Follow ${name}`}
      className={`p-1 rounded-full transition-colors disabled:opacity-50 align-middle
        ${following ? "text-amber-400 hover:text-amber-500" : "text-zinc-500 hover:text-zinc-300"}`}
    >
      {icon}
    </button>
  );
}
