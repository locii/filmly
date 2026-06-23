import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { TMDB_IMAGE_BASE } from "@/lib/tmdb";
import { absoluteUrl } from "@/lib/seo";
import { Film } from "@/lib/types";

export const metadata: Metadata = {
  title: "Published stacks",
  description: "Browse every curated, shareable film stack published on FilmStack.",
  alternates: { canonical: absoluteUrl("/stacks") },
  openGraph: {
    title: "Published stacks",
    description: "Browse every curated, shareable film stack published on FilmStack.",
    url: absoluteUrl("/stacks"),
    type: "website",
  },
};

interface StackRow {
  slug: string;
  query: string;
  films: Film[];
  created_at: string;
}

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default async function StacksIndexPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("published_stacks")
    .select("slug, query, films, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const stacks = (data as StackRow[] | null) ?? [];

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-amber-500 font-medium">Film stacks</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Published stacks</h1>
          <p className="text-zinc-400">Curated, shareable collections — pick one and start watching.</p>
        </div>
        <Link
          href="/stacks/new"
          className="shrink-0 bg-amber-500 hover:bg-amber-600 text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + Create stack
        </Link>
      </div>

      {stacks.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-zinc-400">No stacks published yet.</p>
          <Link href="/discover" className="text-amber-400 hover:text-amber-300 text-sm">
            Create one from Discover →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stacks.map((stack) => {
            const poster = stack.films.find((f) => f.poster_path)?.poster_path ?? null;
            return (
              <Link
                key={stack.slug}
                href={`/stacks/${stack.slug}`}
                className="group flex gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 hover:border-zinc-700 hover:bg-zinc-900/70 transition-colors"
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
            );
          })}
        </div>
      )}
    </div>
  );
}
