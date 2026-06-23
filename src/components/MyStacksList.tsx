"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { TMDB_IMAGE_BASE } from "@/lib/tmdb";
import { useToast } from "@/context/ToastContext";
import { Film } from "@/lib/types";

export interface MyStack {
  slug: string;
  query: string;
  films: Film[];
  created_at: string;
}

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default function MyStacksList({ stacks }: { stacks: MyStack[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [rows, setRows] = useState(stacks);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(slug: string, query: string) {
    if (deleting) return;
    if (!window.confirm(`Delete “${query}”? This can't be undone.`)) return;
    setDeleting(slug);
    try {
      const res = await fetch(`/api/stacks/${slug}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't delete");
      setRows((prev) => prev.filter((s) => s.slug !== slug));
      showToast("Stack deleted", "zinc");
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't delete", "red");
    } finally {
      setDeleting(null);
    }
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-zinc-400">You haven&apos;t created any stacks yet.</p>
        <Link href="/stacks/new" className="text-amber-400 hover:text-amber-300 text-sm">
          Create your first stack →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((stack) => {
        const poster = stack.films.find((f) => f.poster_path)?.poster_path ?? null;
        return (
          <div
            key={stack.slug}
            className="flex gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3"
          >
            <Link
              href={`/stacks/${stack.slug}`}
              className="group flex gap-4 min-w-0 flex-1"
            >
              <div className="shrink-0 w-16 aspect-[2/3] rounded-lg overflow-hidden bg-zinc-800 relative">
                {poster && (
                  <Image
                    src={`${TMDB_IMAGE_BASE}/w185${poster}`}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                )}
              </div>
              <div className="min-w-0 flex flex-col justify-center">
                <h2 className="text-white font-medium leading-snug line-clamp-2 group-hover:text-amber-400 transition-colors">
                  {stack.query}
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  {stack.films.length} films · {dateFmt.format(new Date(stack.created_at))}
                </p>
              </div>
            </Link>
            <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 self-center">
              <Link
                href={`/my-stacks/${stack.slug}/edit`}
                className="text-center text-sm font-medium text-zinc-300 hover:text-white border border-zinc-700 hover:border-zinc-600 px-3 py-1.5 rounded-lg transition-colors"
              >
                Edit
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(stack.slug, stack.query)}
                disabled={deleting === stack.slug}
                className="text-sm font-medium text-red-400 hover:text-white hover:bg-red-600 border border-red-900/60 hover:border-red-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleting === stack.slug ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
