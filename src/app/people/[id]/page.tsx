import Image from "next/image";
import { notFound } from "next/navigation";
import { tmdb, TMDB_IMAGE_BASE } from "@/lib/tmdb";
import { Person, Film } from "@/lib/types";
import SortableFilmGrid from "@/components/SortableFilmGrid";

interface Props {
  params: Promise<{ id: string }>;
}

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default async function PersonPage({ params }: Props) {
  const { id } = await params;
  const personId = parseInt(id.split("-")[0], 10);
  if (isNaN(personId)) notFound();

  let person: Person | null = null;
  try {
    person = await tmdb.person(personId) as Person;
  } catch (err) {
    console.error(`[person] Failed for ID ${personId}:`, err);
  }
  if (!person) notFound();

  const isDirector = person.known_for_department === "Directing";
  const photoUrl = person.profile_path
    ? `${TMDB_IMAGE_BASE}/w342${person.profile_path}`
    : null;

  // Build filmography: directing credits or acting credits, sorted by date desc
  const directedFilms: Film[] = (person.movie_credits?.crew ?? [])
    .filter((c) => c.job === "Director")
    .sort((a, b) => (b.release_date ?? "").localeCompare(a.release_date ?? ""))
    .map(({ job: _j, department: _d, ...f }) => f);

  const actedFilms: Film[] = (person.movie_credits?.cast ?? [])
    .sort((a, b) => (b.release_date ?? "").localeCompare(a.release_date ?? ""))
    .map(({ character: _c, ...f }) => f);

  // Deduplicate by id
  const deduped = (films: Film[]) => {
    const seen = new Set<number>();
    return films.filter((f) => {
      if (seen.has(f.id)) return false;
      seen.add(f.id);
      return true;
    });
  };

  const primaryFilms = deduped(isDirector ? directedFilms : actedFilms);
  const secondaryFilms = isDirector ? deduped(actedFilms) : deduped(directedFilms);

  const age = person.birthday
    ? Math.floor(
        (new Date(person.deathday ?? Date.now()).getTime() - new Date(person.birthday).getTime()) /
          (1000 * 60 * 60 * 24 * 365.25)
      )
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-12">
      {/* Header */}
      <div className="flex gap-6 items-start">
        {photoUrl ? (
          <div className="shrink-0 w-28 sm:w-40 rounded-xl overflow-hidden bg-zinc-800 aspect-[2/3] relative shadow-xl">
            <Image src={photoUrl} alt={person.name} fill className="object-cover" />
          </div>
        ) : (
          <div className="shrink-0 w-28 sm:w-40 rounded-xl bg-zinc-800 aspect-[2/3] flex items-center justify-center text-zinc-600">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}

        <div className="space-y-2 pt-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{person.name}</h1>
          <p className="text-zinc-400 text-sm">{person.known_for_department}</p>
          <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
            {person.birthday && (
              <span>Born {new Date(person.birthday).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}{person.deathday ? "" : age ? ` (age ${age})` : ""}</span>
            )}
            {person.deathday && (
              <span>Died {new Date(person.deathday).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}{age ? ` (aged ${age})` : ""}</span>
            )}
            {person.place_of_birth && <span>{person.place_of_birth}</span>}
          </div>
          {person.biography && (
            <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl line-clamp-3">
              {person.biography}
            </p>
          )}
        </div>
      </div>

      {/* Primary filmography */}
      {primaryFilms.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">
            {isDirector ? "Directed" : "Acting"} · {primaryFilms.length} films
          </h2>
          <SortableFilmGrid films={primaryFilms} />
        </section>
      )}

      {/* Secondary credits */}
      {secondaryFilms.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">
            {isDirector ? "Also appeared in" : "Also directed"}
          </h2>
          <SortableFilmGrid films={secondaryFilms} />
        </section>
      )}
    </div>
  );
}
