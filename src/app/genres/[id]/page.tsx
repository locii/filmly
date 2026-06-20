import { tmdb } from "@/lib/tmdb";
import { Film, Genre, TMDBResponse } from "@/lib/types";
import SortableFilmGrid from "@/components/SortableFilmGrid";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function GenrePage({ params }: Props) {
  const { id } = await params;

  let films: TMDBResponse<Film>;
  let allGenres: { genres: Genre[] };

  try {
    [films, allGenres] = await Promise.all([
      tmdb.byGenre(id) as Promise<TMDBResponse<Film>>,
      tmdb.genres() as Promise<{ genres: Genre[] }>,
    ]);
  } catch {
    notFound();
  }

  const genre = allGenres.genres.find((g) => g.id === parseInt(id, 10));

  async function fetchPage(page: number): Promise<Film[]> {
    "use server";
    try {
      const res = await tmdb.byGenre(id, String(page)) as TMDBResponse<Film>;
      return res.results;
    } catch {
      return [];
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <a href="/genres" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
          ← All genres
        </a>
        <h1 className="text-2xl font-bold text-white mt-2">
          {genre?.name ?? "Genre"}
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          {films.total_results.toLocaleString()} films
        </p>
      </div>

      <SortableFilmGrid
        films={films.results}
        totalPages={films.total_pages}
        currentPage={1}
        fetchPage={fetchPage}
      />
    </div>
  );
}
