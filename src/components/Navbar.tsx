"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SearchBar from "./SearchBar";
import AuthModal from "./AuthModal";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const supabase = createClient();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const navClass = (href: string) => {
    const active = pathname === href || !!pathname?.startsWith(`${href}/`);
    return `hidden sm:block text-sm px-3 py-1.5 transition-colors ${
      active
        ? "text-brand font-medium"
        : "text-zinc-400 hover:text-white"
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

  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  async function handleSignOut() {
    setMenuOpen(false);
    await supabase.auth.signOut();
  }

  const avatarLetter = (user?.email ?? "?").charAt(0).toUpperCase();

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-zinc-950/90 backdrop-blur border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/" className="font-bold text-xl tracking-tight shrink-0">
            🎬 <span className="text-vanilla">Film</span><span className="text-brand">Stack</span>
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

                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen((o) => !o)}
                    aria-label="Account menu"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors"
                  >
                    {avatarLetter}
                  </button>

                  {menuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1 z-50"
                    >
                      {user.email && (
                        <div className="px-3 py-2 border-b border-zinc-800">
                          <p className="text-xs text-zinc-500">Signed in as</p>
                          <p className="text-sm text-zinc-200 truncate">{user.email}</p>
                        </div>
                      )}
                      <button
                        onClick={handleSignOut}
                        role="menuitem"
                        className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
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
