import FilmGrid from "@/components/FilmGrid";
import { tmdb } from "@/lib/tmdb";
import { TMDBResponse, Film } from "@/lib/types";
import Link from "next/link";

export default async function HomePage() {
  const [trending, popular] = await Promise.all([
    tmdb.trending() as Promise<TMDBResponse<Film>>,
    tmdb.popular() as Promise<TMDBResponse<Film>>,
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
      {/* Hero */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-white mb-3">Discover great films</h1>
        <p className="text-zinc-400 text-lg">
          Search, save favourites, and get personalised recommendations.
        </p>
        <div className="flex justify-center gap-4 mt-6">
          <Link
            href="/genres"
            className="bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-lg transition-colors text-sm font-medium"
          >
            Browse genres
          </Link>
          <Link
            href="/recommendations"
            className="bg-brand hover:bg-brand-dark text-white px-5 py-2.5 rounded-lg transition-colors text-sm font-medium"
          >
            Get recommendations
          </Link>
        </div>
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
