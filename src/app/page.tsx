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
  const [trending, popular] = await Promise.all([
    tmdb.trending() as Promise<TMDBResponse<Film>>,
    tmdb.popular() as Promise<TMDBResponse<Film>>,
  ]);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="max-w-7xl mx-auto px-8 pb-4 space-y-8">
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

      {/* Trending */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">Trending this week</h2>
        <FilmGrid films={trending.results.slice(0, 12)} />
      </section>

      {/* Popular */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">Popular right now</h2>
        <FilmGrid films={popular.results.slice(0, 12)} />
      </section>
    </div>
  );
}
