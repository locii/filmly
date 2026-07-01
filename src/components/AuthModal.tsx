"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SITE_URL } from "@/lib/seo";
import BrandMark from "./BrandMark";

interface Props {
  onClose: () => void;
  /** Optional contextual line explaining why we're prompting (e.g. after a save attempt). */
  reason?: string;
}

export default function AuthModal({ onClose, reason }: Props) {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    // Always send the magic link back to the canonical site origin, so links
    // point at production even when signing in from a preview/local deploy.
    // SITE_URL is already normalised (no trailing slash).
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${SITE_URL}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-sm pointer-events-auto shadow-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {sent ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">📬</div>
              <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                We sent a magic link to <span className="text-white">{email}</span>.
                Click it to sign in — no password needed.
              </p>
              <p className="text-zinc-600 text-xs mt-4">
                Didn&apos;t get it? Check your spam folder.
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="flex justify-center mb-3"><BrandMark className="w-10 h-10" /></div>
                <h2 className="text-xl font-bold text-white">Join FilmStack — free</h2>
                <p className="text-zinc-400 text-sm mt-1">
                  {reason ?? "Save films, build stacks, and get personal recommendations."}
                </p>
                <ul className="text-zinc-400 text-sm mt-4 space-y-1.5 text-left inline-block">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-brand shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Free forever — no card required
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-brand shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    No password — just a magic link
                  </li>
                </ul>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  autoFocus
                  className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
                />

                {error && (
                  <p className="text-red-400 text-xs">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full bg-brand hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors text-sm"
                >
                  {loading ? "Sending…" : "Send magic link"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
