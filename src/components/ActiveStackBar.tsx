"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useActiveStack } from "@/context/ActiveStackContext";

// Header control showing the stack the user is currently building. Lets them
// switch the active stack, spin up a new one, or jump to the published page.
export default function ActiveStackBar() {
  const { stacks, activeStack, isLoggedIn, isLoading, setActiveSlug, createStack } = useActiveStack();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Reset the create form whenever the menu closes.
  useEffect(() => {
    if (!open) { setCreating(false); setName(""); }
  }, [open]);

  // Focus the name field when the create form opens.
  useEffect(() => {
    if (creating) inputRef.current?.focus();
  }, [creating]);

  if (!isLoggedIn || isLoading) return null;

  async function handleCreate() {
    const n = name.trim();
    if (!n || busy) return;
    setBusy(true);
    const stack = await createStack(n);
    setBusy(false);
    if (stack) setOpen(false);
  }

  const count = activeStack?.films.length ?? 0;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 max-w-[40vw] sm:max-w-[16rem] h-9 pl-2.5 pr-2 rounded-lg border border-zinc-700 hover:border-amber-500/60 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-200 transition-colors"
        title={activeStack ? `Active stack: ${activeStack.query}` : "Choose a stack"}
      >
        <svg className="w-4 h-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7l8-4 8 4-8 4-8-4zM4 12l8 4 8-4M4 17l8 4 8-4" />
        </svg>
        <span className="hidden sm:block min-w-0 truncate text-sm font-medium">
          {activeStack ? activeStack.query : "No active stack"}
        </span>
        {activeStack && (
          <span className="shrink-0 text-[11px] font-semibold text-amber-400 bg-amber-500/10 rounded px-1.5 py-0.5 tabular-nums">
            {count}
          </span>
        )}
        <svg className={`w-4 h-4 shrink-0 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-72 max-w-[88vw] rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden z-50"
        >
          <div className="px-3 py-2.5 border-b border-zinc-800">
            <p className="text-xs uppercase tracking-wider text-amber-500 font-medium">Active stack</p>
            <p className="text-sm text-zinc-200 truncate mt-0.5">
              {activeStack ? activeStack.query : "Nothing selected yet"}
            </p>
          </div>

          {stacks.length > 0 && (
            <div className="max-h-64 overflow-y-auto py-1">
              {stacks.map((s) => {
                const active = s.slug === activeStack?.slug;
                return (
                  <button
                    key={s.slug}
                    role="menuitemradio"
                    aria-checked={active}
                    onClick={() => { setActiveSlug(s.slug); setOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                      active ? "bg-zinc-800/60 text-white" : "text-zinc-300 hover:bg-zinc-800/40"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? "bg-amber-500" : "bg-zinc-600"}`} />
                    <span className="min-w-0 flex-1 truncate">{s.query}</span>
                    <span className="shrink-0 text-xs text-zinc-500 tabular-nums">{s.films.length}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="border-t border-zinc-800 p-2 space-y-1">
            {creating ? (
              <div className="space-y-2 p-1">
                <input
                  ref={inputRef}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); handleCreate(); }
                  }}
                  placeholder="Stack name…"
                  maxLength={80}
                  className="w-full bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreate}
                    disabled={busy || !name.trim()}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-black text-sm font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    {busy ? "Creating…" : "Create"}
                  </button>
                  <button
                    onClick={() => { setCreating(false); setName(""); }}
                    className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                role="menuitem"
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-amber-400 hover:bg-zinc-800/60 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New stack
              </button>
            )}

            {activeStack && !creating && (
              <Link
                href={`/stacks/${activeStack.slug}`}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800/60 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                View stack
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
