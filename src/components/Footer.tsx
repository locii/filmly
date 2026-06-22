"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import BrandMark from "./BrandMark";

interface RecentStack {
  slug: string;
  query: string;
}

const EXPLORE_LINKS = [
  { href: "/discover", label: "Discover" },
  { href: "/stacks", label: "Stacks" },
  { href: "/genres", label: "Genres" },
  { href: "/recommendations", label: "For You" },
];

export default function Footer() {
  const [stacks, setStacks] = useState<RecentStack[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("published_stacks")
      .select("slug, query")
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => setStacks((data as RecentStack[]) ?? []));
  }, []);

  return (
    <footer className="border-t border-zinc-800 bg-zinc-950/60 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12 pb-24 sm:pb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <Link href="/" className="font-bold text-lg inline-flex items-center gap-2">
              <BrandMark className="w-6 h-6" />
              <span><span className="text-vanilla">Film</span><span className="text-brand">Stack</span></span>
            </Link>
            <p className="text-sm text-zinc-500 max-w-xs">
              Discover films by vibe, browse by genre, and share curated stacks.
            </p>
          </div>

          {/* Explore */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-zinc-400 font-medium">Explore</h3>
            <ul className="space-y-2">
              {EXPLORE_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-zinc-500 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Recent Stacks */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-zinc-400 font-medium">Recent stacks</h3>
            {stacks.length > 0 ? (
              <ul className="space-y-2">
                {stacks.map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/stacks/${s.slug}`}
                      className="text-sm text-zinc-500 hover:text-white transition-colors line-clamp-1"
                    >
                      {s.query}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-600">
                <Link href="/discover" className="hover:text-zinc-400 transition-colors">
                  Publish the first one →
                </Link>
              </p>
            )}
          </div>

          {/* About / legal */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-zinc-400 font-medium">About</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/genres" className="text-sm text-zinc-500 hover:text-white transition-colors">
                  Browse genres
                </Link>
              </li>
              <li>
                <a
                  href="https://www.themoviedb.org/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-zinc-500 hover:text-white transition-colors"
                >
                  Data by TMDB
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-zinc-800/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} FilmStack. All rights reserved.
          </p>
          <p className="text-xs text-zinc-600 max-w-md sm:text-right">
            This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
        </div>
      </div>
    </footer>
  );
}
