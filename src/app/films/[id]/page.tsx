import Image from "next/image";
import { notFound } from "next/navigation";
import { tmdb, TMDB_IMAGE_BASE } from "@/lib/tmdb";
import { Film, FilmDetail, Video, CastMember, CrewMember, TMDBResponse } from "@/lib/types";
import FilmGrid from "@/components/FilmGrid";
import TrailerPlayer from "@/components/TrailerPlayer";
import HeroSection from "@/components/HeroSection";
import FilmActions from "@/components/FilmActions";

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

interface Props {
  params: Promise<{ id: string }>;
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
  const [videosData, creditsData, recommendations] = await Promise.all([
    tmdb.filmVideos(filmId).catch(() => ({ results: [] as Video[] })) as Promise<{ results: Video[] }>,
    tmdb.filmCredits(filmId).catch(() => ({ cast: [] as CastMember[], crew: [] as CrewMember[] })) as Promise<{ cast: CastMember[]; crew: CrewMember[] }>,
    tmdb.recommendations(filmId).catch(() => ({ results: [] as Film[] })) as Promise<TMDBResponse<Film>>,
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

  return (
    <div>
      <HeroSection
        backdropUrl={backdropUrl}
        title={film.title}
        trailerKey={trailer?.key}
      />

      <div className="max-w-7xl mx-auto px-4 -mt-24 relative pb-16 space-y-12">
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
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-3">
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

        {/* Recommendations */}
        {recommendations.results.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">You might also like</h2>
            <FilmGrid films={recommendations.results.slice(0, 12)} />
          </section>
        )}
      </div>
    </div>
  );
}
