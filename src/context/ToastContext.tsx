"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type Tone = "brand" | "green" | "yellow" | "red" | "zinc";

interface Toast {
  id: number;
  message: string;
  tone: Tone;
}

interface ToastContextType {
  showToast: (message: string, tone?: Tone) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const TONE_ACCENT: Record<Tone, string> = {
  brand: "border-l-brand",
  green: "border-l-green-500",
  yellow: "border-l-yellow-400",
  red: "border-l-red-500",
  zinc: "border-l-zinc-500",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, tone: Tone = "brand") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none w-full max-w-xs px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-toast-in pointer-events-auto w-full bg-zinc-900/95 backdrop-blur border border-zinc-700 border-l-4 ${TONE_ACCENT[t.tone]} text-zinc-100 text-sm font-medium px-4 py-2.5 rounded-lg shadow-xl`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
