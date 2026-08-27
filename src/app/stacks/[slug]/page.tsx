import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import { createReadClient } from "@/lib/supabase/read";
import SortableFilmGrid from "@/components/SortableFilmGrid";
import JsonLd from "@/components/JsonLd";
import ShareButtons from "@/components/ShareButtons";
import StackOwnerActions from "@/components/StackOwnerActions";
import { absoluteUrl, filmOgImage } from "@/lib/seo";
import { Film } from "@/lib/types";

// Published stacks are public, read-only content that changes rarely — serve them
// as ISR instead of rendering (with an auth round-trip) on every crawler request.
export const revalidate = 3600;

// Prerender existing stacks at build (these are exactly what the sitemap points
// crawlers at); newly-created ones fall through to on-demand ISR via `revalidate`.
export async function generateStaticParams() {
  try {
    const supabase = createReadClient();
    const { data } = await supabase
      .from("published_stacks")
      .select("slug")
      .gt("total_titles", 0)
      .order("created_at", { ascending: false })
      .limit(1000);
    return (data ?? []).map((s: { slug: string }) => ({ slug: s.slug }));
  } catch {
    return [];
  }
}

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
  author_username: string | null;
}

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

// Memoised so generateMetadata + the page body share a single query per request.
const getStack = cache(async (slug: string): Promise<Stack | null> => {
  const supabase = createReadClient();
  const { data } = await supabase
    .from("published_stacks")
    .select("slug, query, films, total_titles, created_at, created_by, author_name, author_username")
    .eq("slug", slug)
    .maybeSingle();
  return (data as Stack | null) ?? null;
});

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
          <p className="text-zinc-400">
            {stack.films.length} films
            {stack.author_name && (
              <>
                {" · by "}
                {stack.author_username || stack.created_by ? (
                  <Link href={`/u/${stack.author_username ?? stack.created_by}`} className="text-zinc-300 hover:text-amber-400 transition-colors">
                    {stack.author_name}
                  </Link>
                ) : (
                  <span className="text-zinc-300">{stack.author_name}</span>
                )}
              </>
            )}
            {" · "}{dateFmt.format(new Date(stack.created_at))}
          </p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <ShareButtons url={absoluteUrl(`/stacks/${slug}`)} title={stack.query} />
          <StackOwnerActions slug={slug} createdBy={stack.created_by} />
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
