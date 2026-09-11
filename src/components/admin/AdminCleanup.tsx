"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";

interface StaleUser {
  email: string | null;
}

/**
 * One-click purge of stale unverified users — signups whose magic-link email
 * has been out >24h, who never signed in, and who have no stacks or
 * interactions. Previews the exact set first, then deletes on confirmation.
 */
export default function AdminCleanup() {
  const { showToast } = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run() {
    if (busy) return;
    setBusy(true);
    try {
      // Preview so the admin sees precisely who will be deleted.
      const previewRes = await fetch("/api/admin/users/cleanup");
      const preview = await previewRes.json().catch(() => ({}));
      if (!previewRes.ok) throw new Error(preview.error ?? "Couldn't check for stale users");

      const count: number = preview.count ?? 0;
      if (count === 0) {
        showToast("No stale unverified users to remove", "zinc");
        return;
      }

      const sample = ((preview.users ?? []) as StaleUser[])
        .slice(0, 8)
        .map((u) => u.email ?? "(no email)")
        .join("\n");
      const more = count > 8 ? `\n…and ${count - 8} more` : "";
      const ok = window.confirm(
        `Permanently delete ${count} unverified user${count === 1 ? "" : "s"} ` +
          `who never signed in and have no stacks or interactions?\n\n` +
          `${sample}${more}\n\nThis can't be undone.`,
      );
      if (!ok) return;

      const res = await fetch("/api/admin/users/cleanup", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Cleanup failed");

      if (data.failed > 0) {
        showToast(`Deleted ${data.deleted}, ${data.failed} failed`, "yellow");
      } else {
        showToast(`Deleted ${data.deleted} stale user${data.deleted === 1 ? "" : "s"}`, "green");
      }
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Cleanup failed", "red");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={run}
      disabled={busy}
      className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors disabled:opacity-40"
    >
      {busy ? "Working…" : "Purge stale unverified users"}
    </button>
  );
}
