import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { tmdb, TMDB_IMAGE_BASE } from "@/lib/tmdb";
import { Film, FilmDetail, Video, CastMember, CrewMember, TMDBResponse, WatchProvidersResponse } from "@/lib/types";
import SortableFilmGrid from "@/components/SortableFilmGrid";
import TrailerPlayer from "@/components/TrailerPlayer";
import HeroSection from "@/components/HeroSection";
import FilmActions from "@/components/FilmActions";
import WatchProviders from "@/components/WatchProviders";
import JsonLd from "@/components/JsonLd";
import { getWatchmodeDeepLinks } from "@/lib/watchmode";
import { absoluteUrl, filmOgImage } from "@/lib/seo";

// Region used for "Where to watch" provider data. Override via env.
const WATCH_REGION = process.env.NEXT_PUBLIC_WATCH_REGION ?? "GB";

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const filmId = parseInt(id.split("-")[0], 10);
  if (isNaN(filmId)) return { title: "Film not found", robots: { index: false } };

  let film: FilmDetail | null = null;
  try {
    film = await tmdb.filmDetails(filmId) as FilmDetail;
  } catch {
    return { title: "Film not found", robots: { index: false } };
  }
  if (!film) return { title: "Film not found", robots: { index: false } };

  const year = film.release_date?.slice(0, 4);
  const title = year ? `${film.title} (${year})` : film.title;
  const description =
    film.overview?.slice(0, 200) || `${film.title} — cast, trailer, ratings and where to watch.`;
  const images = filmOgImage(film, film.title);
  const url = absoluteUrl(`/films/${filmId}-${slugify(film.title)}`);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "video.movie", images },
    twitter: {
      card: images.length ? "summary_large_image" : "summary",
      title,
      description,
      images: images.map((i) => i.url),
    },
  };
}

export default async function FilmPage({ params }: Props) {
  const { id } = await params;
  const filmId = parseInt(id.split("-")[0], 10);
  if (isNaN(filmId)) notFound();

  let film: FilmDetail | null = null;
  try {
    film = await tmdb.filmDetails(filmId) as FilmDetail;
  } catch (err) {
    console.error(`[film detail] Failed for ID ${filmId}:`, err);
  }
  if (!film) notFound();

  // Non-fatal parallel fetches — page renders even if these fail
  const [videosData, creditsData, recsData, similarData, providersData] = await Promise.all([
    tmdb.filmVideos(filmId).catch(() => ({ results: [] as Video[] })) as Promise<{ results: Video[] }>,
    tmdb.filmCredits(filmId).catch(() => ({ cast: [] as CastMember[], crew: [] as CrewMember[] })) as Promise<{ cast: CastMember[]; crew: CrewMember[] }>,
    tmdb.recommendations(filmId).catch(() => ({ results: [] as Film[] })) as Promise<TMDBResponse<Film>>,
    tmdb.similar(filmId).catch(() => ({ results: [] as Film[] })) as Promise<TMDBResponse<Film>>,
    tmdb.watchProviders(filmId).catch(() => ({ id: filmId, results: {} })) as Promise<WatchProvidersResponse>,
  ]);

  const backdropUrl = film.backdrop_path
    ? `${TMDB_IMAGE_BASE}/w1280${film.backdrop_path}`
    : null;
  const posterUrl = film.poster_path
    ? `${TMDB_IMAGE_BASE}/w500${film.poster_path}`
    : null;

  const year = film.release_date?.slice(0, 4) ?? "";
  const rating = film.vote_average ? film.vote_average.toFixed(1) : "—";
  const runtime = film.runtime
    ? `${Math.floor(film.runtime / 60)}h ${film.runtime % 60}m`
    : null;

  // Pick best trailer: official trailer → any trailer → teaser
  const videos = videosData.results;
  const trailer =
    videos.find((v) => v.site === "YouTube" && v.type === "Trailer" && v.official) ??
    videos.find((v) => v.site === "YouTube" && v.type === "Trailer") ??
    videos.find((v) => v.site === "YouTube" && v.type === "Teaser");

  const director = creditsData.crew.find((c) => c.job === "Director");
  const cast = creditsData.cast.slice(0, 10);

  const watchRegion = providersData.results?.[WATCH_REGION];
  // Only call Watchmode when there's something to deep-link (saves API quota).
  const watchDeepLinks = watchRegion
    ? await getWatchmodeDeepLinks(filmId, WATCH_REGION).catch(() => ({}))
    : {};

  // Merge recommendations + similar, deduplicate, exclude the current film
  // Interleave so we get variety rather than all recs first then all similar
  const seen = new Set<number>([filmId]);
  const suggestions: Film[] = [];
  const recList = recsData.results ?? [];
  const simList = similarData.results ?? [];
  const maxLen = Math.max(recList.length, simList.length);
  for (let i = 0; i < maxLen; i++) {
    for (const f of [recList[i], simList[i]]) {
      if (f && !seen.has(f.id)) {
        seen.add(f.id);
        suggestions.push(f);
      }
    }
  }

  const movieJsonLd = {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: film.title,
    url: absoluteUrl(`/films/${filmId}-${slugify(film.title)}`),
    ...(film.overview ? { description: film.overview } : {}),
    ...(posterUrl ? { image: posterUrl } : {}),
    ...(film.release_date ? { datePublished: film.release_date } : {}),
    ...(film.runtime ? { duration: `PT${film.runtime}M` } : {}),
    ...(film.genres?.length ? { genre: film.genres.map((g) => g.name) } : {}),
    ...(director ? { director: { "@type": "Person", name: director.name } } : {}),
    ...(cast.length
      ? { actor: cast.map((c) => ({ "@type": "Person", name: c.name })) }
      : {}),
    ...(trailer
      ? {
          trailer: {
            "@type": "VideoObject",
            name: `${film.title} Trailer`,
            embedUrl: `https://www.youtube.com/embed/${trailer.key}`,
            ...(backdropUrl ? { thumbnailUrl: backdropUrl } : {}),
            ...(film.release_date ? { uploadDate: film.release_date } : {}),
          },
        }
      : {}),
    ...(film.vote_count && film.vote_average
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: film.vote_average.toFixed(1),
            ratingCount: film.vote_count,
            bestRating: 10,
            worstRating: 0,
          },
        }
      : {}),
  };

  return (
    <div>
      <JsonLd data={movieJsonLd} />
      <HeroSection
        backdropUrl={backdropUrl}
        title={film.title}
        trailerKey={trailer?.key}
      />

      <div className="max-w-7xl mx-auto p-8  -mt-24 relative space-y-12">
        {/* Header */}
        <div className="flex gap-6 items-end">
          <div className="shrink-0 w-32 sm:w-44 rounded-lg overflow-hidden shadow-2xl bg-zinc-800 aspect-[2/3] relative">
            {posterUrl ? (
              <Image src={posterUrl} alt={film.title} fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 bg-zinc-800" />
            )}
          </div>

          <div className="pb-2 space-y-2">
            <div className="flex items-start gap-2">
              <h1 className="text-2xl sm:text-4xl font-bold text-white leading-tight">
                {film.title}
              </h1>
              <FilmActions film={{ ...film, genre_ids: film.genres?.map((g) => g.id) ?? [] }} />
            </div>
            {film.tagline && (
              <p className="text-zinc-400 italic text-sm">{film.tagline}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
              {year && <span>{year}</span>}
              {runtime && <span>{runtime}</span>}
              <span className="text-yellow-400 font-semibold">★ {rating}</span>
              {director && (
                <a
                  href={`/people/${director.id}-${slugify(director.name)}`}
                  className="hover:text-white transition-colors"
                >
                  Dir. {director.name}
                </a>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {film.genres?.map((g) => (
                <a
                  key={g.id}
                  href={`/genres/${g.id}`}
                  className="bg-zinc-800 hover:bg-zinc-700 px-2 py-0.5 rounded text-xs text-zinc-300 transition-colors"
                >
                  {g.name}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Overview */}
        {film.overview && (
          <p className="text-zinc-300 max-w-3xl text-base leading-relaxed">{film.overview}</p>
        )}

        {/* Where to watch */}
        {watchRegion && (
          <WatchProviders region={watchRegion} regionCode={WATCH_REGION} deepLinks={watchDeepLinks} />
        )}

        {/* Trailer */}
        {trailer && (
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Trailer</h2>
            <TrailerPlayer videoKey={trailer.key} title={trailer.name} />
          </section>
        )}

        {/* Cast */}
        {cast.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Cast</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 lg:grid-cols-10 gap-3">
              {cast.map((member) => (
                <a
                  key={member.id}
                  href={`/people/${member.id}-${slugify(member.name)}`}
                  className="text-center group/cast"
                >
                  <div className="aspect-square rounded-full overflow-hidden bg-zinc-800 mb-1.5 relative ring-2 ring-transparent group-hover/cast:ring-brand transition-all">
                    {member.profile_path ? (
                      <Image
                        src={`${TMDB_IMAGE_BASE}/w185${member.profile_path}`}
                        alt={member.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium text-zinc-200 group-hover/cast:text-white leading-tight transition-colors">{member.name}</p>
                  <p className="text-xs text-zinc-500 leading-tight mt-0.5 line-clamp-2">{member.character}</p>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Suggestions: recs + similar interleaved */}
        {suggestions.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">You might also like</h2>
            <SortableFilmGrid films={suggestions} />
          </section>
        )}
      </div>
    </div>
  );
}
