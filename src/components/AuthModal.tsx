"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  onClose: () => void;
}

export default function AuthModal({ onClose }: Props) {
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

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
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
                <div className="text-3xl mb-3">🎬</div>
                <h2 className="text-xl font-bold text-white">Sign in to FilmStack</h2>
                <p className="text-zinc-400 text-sm mt-1">
                  We&apos;ll email you a magic link — no password needed.
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
