import FilmGrid from "@/components/FilmGrid";
import DiscoverPanel from "@/components/DiscoverPanel";
import JsonLd from "@/components/JsonLd";
import { tmdb } from "@/lib/tmdb";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL, SITE_NAME } from "@/lib/seo";
import { TMDBResponse, Film } from "@/lib/types";
import Link from "next/link";

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default async function HomePage() {
  const popular = await tmdb.popular() as TMDBResponse<Film>;

  const supabase = await createClient();
  const [{ data: { user } }, { data: latestStack }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("published_stacks")
      .select("slug, query, films")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ slug: string; query: string; films: Film[] }>(),
  ]);

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      <JsonLd data={websiteJsonLd} />
      {/* Hero */}
      <div className="text-left py-8">
        {user ? (
          <>
            <h1 className="text-4xl font-bold text-white mb-3">What kind of film do you want to watch?</h1>
            <DiscoverPanel />
          </>
        ) : (
          <>
            <h1 className="text-4xl font-bold text-white mb-3">Find your next favourite film.</h1>
            <p className="text-zinc-400 text-lg">
              Browse what&apos;s trending — or sign in to search by vibe, save a watchlist, and get recommendations.
            </p>
          </>
        )}
      </div>

      <hr className="border-zinc-800" />

      <div className="flex gap-4">
          <Link
            href="/genres"
            className="bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-lg transition-colors text-sm font-medium"
          >
            Browse genres
          </Link>
          <Link
            href="/recommendations"
            className="bg-brand hover:bg-zinc-700 text-white px-5 py-2.5 rounded-lg transition-colors text-sm font-medium"
          >
            Get recommendations
          </Link>
        </div>

      {/* Latest stack */}
      {latestStack && latestStack.films.length > 0 && (
        <section>
          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-brand font-medium">Latest stack</p>
              <h2 className="text-xl font-semibold text-white">{latestStack.query}</h2>
            </div>
            <Link
              href={`/stacks/${latestStack.slug}`}
              className="shrink-0 text-sm text-brand hover:text-white transition-colors"
            >
              View stack →
            </Link>
          </div>
          <FilmGrid films={latestStack.films.slice(0, 12)} />
        </section>
      )}
    </div>
  );
}
