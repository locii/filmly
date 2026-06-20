"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }, 400);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length >= 2) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search films…"
          className="w-full bg-zinc-800 text-zinc-100 placeholder-zinc-500 pl-9 pr-4 py-2 rounded-lg border border-zinc-700 focus:outline-none focus:border-zinc-500 text-sm"
        />
      </div>
    </form>
  );
}
