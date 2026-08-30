"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SITE_URL } from "@/lib/seo";
import BrandMark from "@/components/BrandMark";

/**
 * Standalone sign-in, used by the site-wide auth gate in middleware.ts.
 * AuthModal covers the in-app prompt; this is the page you land on when you
 * aren't signed in at all, so it has no close button and nothing behind it.
 */
export default function SignInForm() {
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

    // Always send the link to the canonical origin so it works regardless of
    // which host the form was served from.
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${SITE_URL}/auth/callback` },
    });

    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-zinc-950">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        {sent ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-4">📬</div>
            <h1 className="text-xl font-bold text-white mb-2">Check your email</h1>
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
              <div className="flex justify-center mb-3">
                <BrandMark className="w-10 h-10" />
              </div>
              <h1 className="text-xl font-bold text-white">FilmStack</h1>
              <p className="text-zinc-400 text-sm mt-1">
                This site is private. Sign in with your email to continue.
              </p>
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

              {error && <p className="text-red-400 text-xs">{error}</p>}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full bg-brand hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg px-4 py-3 text-sm transition-colors"
              >
                {loading ? "Sending…" : "Email me a magic link"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
