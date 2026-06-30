import type { Metadata } from "next";
import Link from "next/link";
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
  created_by: string | null;
  author_name: string | null;
}

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

async function getStack(slug: string): Promise<Stack | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("published_stacks")
    .select("slug, query, films, total_titles, created_at, created_by, author_name")
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

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = !!user && user.id === stack.created_by;

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
          <p className="text-zinc-400">
            {stack.films.length} films
            {stack.author_name && <> · by <span className="text-zinc-300">{stack.author_name}</span></>}
            {" · "}{dateFmt.format(new Date(stack.created_at))}
          </p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <ShareButtons url={absoluteUrl(`/stacks/${slug}`)} title={stack.query} />
          {isOwner && (
            <Link
              href={`/my-stacks/${slug}/edit`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-300 hover:text-white border border-zinc-700 hover:border-zinc-600 px-3 py-1.5 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit stack
            </Link>
          )}
        </div>
      </div>

      <SortableFilmGrid
        films={stack.films}
        emptyMessage="This stack is empty."
        searchable={stack.films.length > 0}
        searchPlaceholder={`Search ${stack.query}…`}
      />
    </div>
  );
}
