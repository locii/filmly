import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SortableFilmGrid from "@/components/SortableFilmGrid";
import JsonLd from "@/components/JsonLd";
import ShareButtons from "@/components/ShareButtons";
import { absoluteUrl, filmOgImage } from "@/lib/seo";
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
  if (!stack) return { title: "Stack not found", robots: { index: false } };

  // Unfurl image comes from the first film in the stack.
  const images = filmOgImage(stack.films[0], stack.query);
  const url = absoluteUrl(`/stacks/${slug}`);
  const description = `A curated stack of ${stack.films.length} films: ${stack.query}.`;

  return {
    title: stack.query,
    description,
    alternates: { canonical: url },
    openGraph: { title: stack.query, description, url, type: "website", images },
    twitter: {
      card: images.length ? "summary_large_image" : "summary",
      title: stack.query,
      description,
      images: images.map((i) => i.url),
    },
  };
}

export default async function StackPage({ params }: Props) {
  const { slug } = await params;
  const stack = await getStack(slug);
  if (!stack) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: stack.query,
    url: absoluteUrl(`/stacks/${slug}`),
    numberOfItems: stack.films.length,
    itemListElement: stack.films.slice(0, 50).map((film, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Movie",
        name: film.title,
        url: absoluteUrl(`/films/${film.id}`),
        ...(film.release_date ? { datePublished: film.release_date } : {}),
      },
    })),
  };

  return (
    <div className="max-w-7xl mx-auto px-8 space-y-10">
      <JsonLd data={jsonLd} />
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-amber-500 font-medium">Film stack</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">{stack.query}</h1>
          <p className="text-zinc-400">{stack.films.length} films</p>
        </div>
        <ShareButtons url={absoluteUrl(`/stacks/${slug}`)} title={stack.query} />
      </div>

      <SortableFilmGrid films={stack.films} emptyMessage="This stack is empty." />
    </div>
  );
}
