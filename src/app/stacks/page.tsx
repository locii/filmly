import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/seo";
import StackCard, { StackCardData } from "@/components/StackCard";

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

export default async function StacksIndexPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("published_stacks")
    .select("slug, query, films, created_at, author_name")
    .gt("total_titles", 0)
    .order("created_at", { ascending: false })
    .limit(100);

  const stacks = (data as StackCardData[] | null) ?? [];

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
          {stacks.map((stack) => (
            <StackCard key={stack.slug} stack={stack} />
          ))}
        </div>
      )}
    </div>
  );
}
