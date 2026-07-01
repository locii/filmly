"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import AuthModal from "@/components/AuthModal";

interface AuthPromptContextType {
  /**
   * Open the sign-up modal, optionally with a contextual reason line
   * (e.g. "Sign up free to save films to your watchlist.").
   */
  promptSignup: (reason?: string) => void;
}

const AuthPromptContext = createContext<AuthPromptContextType | null>(null);

export function AuthPromptProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string | undefined>(undefined);

  const promptSignup = useCallback((r?: string) => {
    setReason(r);
    setOpen(true);
  }, []);

  // Auto-dismiss once the visitor is authenticated (magic link signs them in).
  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) setOpen(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthPromptContext.Provider value={{ promptSignup }}>
      {children}
      {open && <AuthModal reason={reason} onClose={() => setOpen(false)} />}
    </AuthPromptContext.Provider>
  );
}

export function useAuthPrompt() {
  const ctx = useContext(AuthPromptContext);
  if (!ctx) throw new Error("useAuthPrompt must be used within AuthPromptProvider");
  return ctx;
}
