"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import { Profile } from "@/lib/types";

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

interface Field {
  key: "display_name" | "bio" | "location" | "website";
  label: string;
  placeholder: string;
  hint?: string;
  type?: "text" | "url";
  multiline?: boolean;
  max: number;
}

const FIELDS: Field[] = [
  { key: "display_name", label: "Display name", placeholder: "e.g. Ava Cardenas", hint: "Shown as the author on stacks you publish.", max: 50 },
  { key: "bio", label: "Bio", placeholder: "A line or two about the films you love…", multiline: true, max: 280 },
  { key: "location", label: "Location", placeholder: "e.g. London, UK", max: 100 },
  { key: "website", label: "Website", placeholder: "yoursite.com", type: "url", max: 200 },
];

export default function ProfileForm({ profile, email, joinedAt }: { profile: Profile | null; email: string | null; joinedAt: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [username, setUsername] = useState(profile?.username ?? "");
  const [values, setValues] = useState({
    display_name: profile?.display_name ?? "",
    bio: profile?.bio ?? "",
    location: profile?.location ?? "",
    website: profile?.website ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key: Field["key"], v: string) => setValues((prev) => ({ ...prev, [key]: v }));

  async function save() {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, username }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't save");
      showToast("Profile saved", "green");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      {/* Account info — read-only */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-1">
        <div className="flex justify-between gap-4 text-sm">
          <span className="text-zinc-500">Email</span>
          <span className="text-zinc-300 truncate">{email ?? "—"}</span>
        </div>
        <div className="flex justify-between gap-4 text-sm">
          <span className="text-zinc-500">Joined</span>
          <span className="text-zinc-300">{dateFmt.format(new Date(joinedAt))}</span>
        </div>
      </div>

      {/* Handle */}
      <div className="space-y-1.5">
        <label htmlFor="username" className="block text-sm font-medium text-zinc-300">Handle</label>
        <div className="flex items-center bg-zinc-800/60 border border-zinc-700 rounded-xl px-4 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand transition">
          <span className="text-zinc-500 text-sm select-none">@</span>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 30))}
            placeholder="yourname"
            className="flex-1 bg-transparent py-3 pl-1 text-white placeholder-zinc-500 focus:outline-none text-sm"
          />
        </div>
        <p className="text-xs text-zinc-500">
          Your public page: <span className="text-zinc-400">thefilmstack.com/u/{username || "yourname"}</span> · 3–30 lowercase letters, numbers or underscores.
        </p>
      </div>

      {FIELDS.map((f) => (
        <div key={f.key} className="space-y-1.5">
          <label htmlFor={f.key} className="block text-sm font-medium text-zinc-300">{f.label}</label>
          {f.multiline ? (
            <textarea
              id={f.key}
              value={values[f.key]}
              onChange={(e) => set(f.key, e.target.value)}
              placeholder={f.placeholder}
              maxLength={f.max}
              rows={3}
              className="w-full bg-zinc-800/60 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 resize-none focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition text-sm"
            />
          ) : (
            <input
              id={f.key}
              type={f.type ?? "text"}
              value={values[f.key]}
              onChange={(e) => set(f.key, e.target.value)}
              placeholder={f.placeholder}
              maxLength={f.max}
              className="w-full bg-zinc-800/60 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition text-sm"
            />
          )}
          {f.hint && <p className="text-xs text-zinc-500">{f.hint}</p>}
        </div>
      ))}

      {error && <p className="text-amber-400 text-sm">{error}</p>}

      <button
        onClick={save}
        disabled={saving}
        className="bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-5 py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {saving ? "Saving…" : "Save profile"}
      </button>
    </div>
  );
}
