"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SearchBar from "./SearchBar";
import AuthModal from "./AuthModal";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const supabase = createClient();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  const navClass = (href: string) => {
    const active = pathname === href || !!pathname?.startsWith(`${href}/`);
    return `hidden sm:block text-sm px-3 py-1.5 rounded-lg transition-colors ${
      active
        ? "text-white bg-zinc-800 font-medium"
        : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
    }`;
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) setShowAuth(false);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-zinc-950/90 backdrop-blur border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/" className="font-bold text-xl tracking-tight shrink-0">
            🎬 <span className="text-vanilla">Film</span><span className="text-brand">ly</span>
          </Link>

          <div className="flex-1">
            <SearchBar />
          </div>

          <nav className="flex items-center gap-2 shrink-0">
            <Link href="/genres" className={navClass("/genres")}>
              Genres
            </Link>
            <Link href="/discover" className={navClass("/discover")}>
              Discover
            </Link>

            {user ? (
              <>
                <Link href="/watchlist" className={navClass("/watchlist")}>
                  Watchlist
                </Link>
                <Link href="/recommendations" className={navClass("/recommendations")}>
                  For You
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="text-sm bg-brand hover:bg-brand-dark text-white px-4 py-1.5 rounded-lg transition-colors font-medium"
              >
                Sign in
              </button>
            )}
          </nav>
        </div>
      </header>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
