"use client";

import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";

export interface AdminStackRow {
  slug: string;
  query: string;
  films: number;
  author_name: string | null;
  created_at: string;
}

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default function AdminStacks({ stacks }: { stacks: AdminStackRow[] }) {
  const { showToast } = useToast();
  const [rows, setRows] = useState(stacks);
  const [busy, setBusy] = useState<string | null>(null);

  async function remove(slug: string, query: string) {
    if (busy) return;
    if (!window.confirm(`Delete the stack “${query}”? This can't be undone.`)) return;
    setBusy(slug);
    try {
      const res = await fetch(`/api/admin/stacks/${slug}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't delete stack");
      setRows((prev) => prev.filter((s) => s.slug !== slug));
      showToast("Stack deleted", "zinc");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't delete stack", "red");
    } finally {
      setBusy(null);
    }
  }

  if (rows.length === 0) {
    return <p className="text-zinc-500 text-sm">No stacks.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
            <th className="px-4 py-3 font-medium">Stack</th>
            <th className="px-4 py-3 font-medium">Author</th>
            <th className="px-4 py-3 font-medium text-right">Films</th>
            <th className="px-4 py-3 font-medium">Created</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.slug} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-900/40">
              <td className="px-4 py-3">
                <Link href={`/stacks/${s.slug}`} className="text-zinc-200 hover:text-amber-400 transition-colors">
                  {s.query}
                </Link>
              </td>
              <td className="px-4 py-3 text-zinc-400 truncate max-w-[12rem]">{s.author_name ?? "—"}</td>
              <td className="px-4 py-3 text-right text-zinc-300 tabular-nums">{s.films}</td>
              <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{dateFmt.format(new Date(s.created_at))}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/stacks/${s.slug}`}
                    className="text-xs font-medium px-2.5 py-1 rounded-lg border border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => remove(s.slug, s.query)}
                    disabled={busy === s.slug}
                    className="text-xs font-medium px-2.5 py-1 rounded-lg border border-red-900/60 text-red-400 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors disabled:opacity-40"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
