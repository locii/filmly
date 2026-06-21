"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const EXAMPLES = [
  "A gritty noir with an anti-hero",
  "Feel-good 80s family adventure",
  "Mind-bending sci-fi like Inception",
  "Funny, heartwarming coming-of-age",
];

export default function DiscoverPanel() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function go(q: string) {
    const value = q.trim();
    if (!value) return;
    router.push(`/discover?q=${encodeURIComponent(value)}`);
  }

  return (
    <div className="max-w-7xl mx-auto text-left">

      <input
        id="home-discover"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            go(query);
          }
        }}
        placeholder="e.g. a slow-burn mystery set by the sea, or a 90s heist comedy…"
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3.5 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-brand transition-colors"
      />

      <p className="text-xs text-zinc-600 mt-2">Press Enter to discover</p>

      <div className="flex flex-wrap gap-2 mt-4">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => go(ex)}
            className="text-xs text-zinc-400 bg-zinc-800/60 hover:bg-zinc-700 hover:text-white border border-zinc-700/50 rounded-full px-3 py-1.5 transition-colors"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
