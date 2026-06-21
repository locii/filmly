import type { Metadata } from "next";
import { tmdb, TMDB_IMAGE_BASE } from "@/lib/tmdb";
import { Genre, Film, TMDBResponse } from "@/lib/types";
import { absoluteUrl } from "@/lib/seo";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Browse genres",
  description: "Explore films by genre — action, drama, sci-fi, horror and more.",
  alternates: { canonical: absoluteUrl("/genres") },
  openGraph: {
    title: "Browse genres",
    description: "Explore films by genre — action, drama, sci-fi, horror and more.",
    url: absoluteUrl("/genres"),
    type: "website",
  },
};

export default async function GenresPage() {
  const data = await tmdb.genres() as { genres: Genre[] };
  const genres = data.genres;

  // Fetch one popular film per genre in parallel for background images
  const filmsByGenre = await Promise.all(
    genres.map((genre) =>
      (tmdb.byGenre(String(genre.id), "1") as Promise<TMDBResponse<Film>>)
        .then((r) => r.results[0] ?? null)
        .catch(() => null)
    )
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-8">Browse by genre</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {genres.map((genre, i) => {
          const film = filmsByGenre[i];
          const posterUrl = film?.poster_path
            ? `${TMDB_IMAGE_BASE}/w342${film.poster_path}`
            : null;

          return (
            <Link
              key={genre.id}
              href={`/genres/${genre.id}`}
              className="relative group aspect-[2/3] rounded-xl overflow-hidden bg-zinc-800 block"
            >
              {/* Poster background */}
              {posterUrl && (
                <img
                  src={posterUrl}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 group-hover:from-black/80 transition-colors" />

              {/* Genre name */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white font-semibold text-sm leading-tight">{genre.name}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
