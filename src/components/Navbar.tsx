"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SearchBar from "./SearchBar";
import AuthModal from "./AuthModal";
import BrandMark from "./BrandMark";
import ActiveStackBar from "./ActiveStackBar";
import type { User } from "@supabase/supabase-js";

const NAV_LINKS = [
  { href: "/genres", label: "Genres" },
  { href: "/discover", label: "Discover", auth: true },
  { href: "/stacks", label: "Stacks" },
];

// Shown in the drawer only when signed in.
const USER_LINKS = [
  { href: "/watchlist", label: "Watchlist" },
  { href: "/recommendations", label: "For You" },
  { href: "/my-stacks", label: "My stacks" },
];

export default function Navbar() {
  const supabase = createClient();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) setShowAuth(false);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  // Close the drawer on route change.
  useEffect(() => setOpen(false), [pathname]);

  // Lock body scroll + close on Escape while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  async function handleSignOut() {
    setOpen(false);
    await supabase.auth.signOut();
  }

  function openAuth() {
    setOpen(false);
    setShowAuth(true);
  }

  const avatarLetter = (user?.email ?? "?").charAt(0).toUpperCase();

  const linkClass = (href: string) => {
    const active = pathname === href || !!pathname?.startsWith(`${href}/`);
    return `block px-3 py-2.5 rounded-lg text-sm transition-colors ${
      active ? "text-brand bg-zinc-800/60 font-medium" : "text-zinc-300 hover:bg-zinc-800"
    }`;
  };

  // Inline header links shown to logged-out visitors.
  const topLinkClass = (href: string) => {
    const active = pathname === href || !!pathname?.startsWith(`${href}/`);
    return `text-sm px-3 py-1.5 transition-colors ${
      active ? "text-brand font-medium" : "text-zinc-400 hover:text-white"
    }`;
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-zinc-950/90 backdrop-blur border-b border-zinc-800">
        <div className="max-w-7xl mx-auto p-8 h-16 flex items-center gap-4">
          <Link href="/" className="font-bold text-xl tracking-tight shrink-0 inline-flex items-center gap-2">
            <BrandMark className="w-6 h-6" />
            <span><span className="text-vanilla">Film</span><span className="text-brand">Stack</span></span>
          </Link>

          {/* Inline search — desktop only. On small screens it lives in the drawer. */}
          <div className="flex-1 hidden md:block">
            <SearchBar />
          </div>
          <div className="flex-1 md:hidden" />

          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <>
                <ActiveStackBar />
                <button
                  onClick={() => setOpen(true)}
                  aria-label="Open menu"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors"
                >
                  {avatarLetter}
                </button>
                <button
                  onClick={() => setOpen(true)}
                  aria-label="Open menu"
                  aria-haspopup="menu"
                  aria-expanded={open}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                {/* Desktop: inline links + sign in */}
                <Link href="/genres" className={`hidden md:inline-block ${topLinkClass("/genres")}`}>Genres</Link>
                <Link href="/stacks" className={`hidden md:inline-block ${topLinkClass("/stacks")}`}>Stacks</Link>
                <button
                  onClick={openAuth}
                  className="hidden md:inline-block text-sm bg-brand hover:bg-brand-dark text-white px-4 py-1.5 rounded-lg transition-colors font-medium"
                >
                  Sign in
                </button>
                {/* Mobile: hamburger */}
                <button
                  onClick={() => setOpen(true)}
                  aria-label="Open menu"
                  aria-haspopup="menu"
                  aria-expanded={open}
                  className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Off-canvas drawer */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
        <aside
          role="menu"
          className={`absolute top-0 right-0 h-full w-72 max-w-[82vw] bg-zinc-950 border-l border-zinc-800 shadow-xl flex flex-col transition-transform duration-200 ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="h-16 px-4 flex items-center justify-between border-b border-zinc-800 shrink-0">
            <span className="text-sm font-semibold text-zinc-200">Menu</span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {/* Search — drawer only on mobile (inline in header on desktop) */}
            <div className="md:hidden px-1 pb-2">
              <SearchBar />
            </div>

            {NAV_LINKS.filter((l) => !l.auth || user).map((l) => (
              <Link key={l.href} href={l.href} role="menuitem" className={linkClass(l.href)}>
                {l.label}
              </Link>
            ))}

            <div className="my-3 border-t border-zinc-800" />

            {user ? (
              <>
                {user.email && (
                  <div className="px-3 pb-2">
                    <p className="text-xs text-zinc-500 pt-4">Signed in as</p>
                    <p className="text-sm text-zinc-200 truncate">{user.email}</p>
                  </div>
                )}
                {USER_LINKS.map((l) => (
                  <Link key={l.href} href={l.href} role="menuitem" className={linkClass(l.href)}>
                    {l.label}
                  </Link>
                ))}
                <button
                  onClick={handleSignOut}
                  role="menuitem"
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                onClick={openAuth}
                className="w-full bg-brand hover:bg-brand-dark text-white text-sm font-medium px-3 py-2.5 rounded-lg transition-colors mt-4"
              >
                Sign in
              </button>
            )}
          </nav>
        </aside>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
