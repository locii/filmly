import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SortableFilmGrid from "@/components/SortableFilmGrid";
import { Film } from "@/lib/types";

interface Props {
  params: Promise<{ slug: string }>;
}

interface Stack {
  slug: string;
  query: string;
  films: Film[];
  total_titles: number;
  created_at: string;
}

async function getStack(slug: string): Promise<Stack | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("published_stacks")
    .select("slug, query, films, total_titles, created_at")
    .eq("slug", slug)
    .maybeSingle();
  return (data as Stack | null) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const stack = await getStack(slug);
  if (!stack) return { title: "Stack not found · FilmStack" };

  const title = `${stack.query} · FilmStack`;
  const description = `A hand-picked stack of ${stack.films.length} films: ${stack.query}.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default async function StackPage({ params }: Props) {
  const { slug } = await params;
  const stack = await getStack(slug);
  if (!stack) notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-10">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-amber-500 font-medium">Film stack</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white">{stack.query}</h1>
        <p className="text-zinc-400">{stack.films.length} films</p>
      </div>

      <SortableFilmGrid films={stack.films} emptyMessage="This stack is empty." />
    </div>
  );
}
