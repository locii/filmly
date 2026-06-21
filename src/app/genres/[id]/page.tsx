import type { Metadata } from "next";
import { tmdb } from "@/lib/tmdb";
import { Film, Genre, TMDBResponse } from "@/lib/types";
import SortableFilmGrid from "@/components/SortableFilmGrid";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl, filmOgImage } from "@/lib/seo";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  let genreName = "Genre";
  let firstFilm: Film | undefined;
  try {
    const [films, allGenres] = await Promise.all([
      tmdb.byGenre(id) as Promise<TMDBResponse<Film>>,
      tmdb.genres() as Promise<{ genres: Genre[] }>,
    ]);
    genreName = allGenres.genres.find((g) => g.id === parseInt(id, 10))?.name ?? "Genre";
    firstFilm = films.results[0];
  } catch {
    return { title: "Genre not found", robots: { index: false } };
  }

  const title = `${genreName} films`;
  const description = `Browse the best ${genreName.toLowerCase()} films — sorted by rating, release date and more.`;
  const images = filmOgImage(firstFilm, title);
  const url = absoluteUrl(`/genres/${id}`);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", images },
    twitter: {
      card: images.length ? "summary_large_image" : "summary",
      title,
      description,
      images: images.map((i) => i.url),
    },
  };
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

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${genre?.name ?? "Genre"} films`,
    url: absoluteUrl(`/genres/${id}`),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: films.results.length,
      itemListElement: films.results.slice(0, 20).map((film, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Movie",
          name: film.title,
          url: absoluteUrl(`/films/${film.id}`),
        },
      })),
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <JsonLd data={collectionJsonLd} />
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
