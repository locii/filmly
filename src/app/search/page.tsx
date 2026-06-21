import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import SearchResults from "@/components/SearchResults";
import { tmdb, TMDB_IMAGE_BASE } from "@/lib/tmdb";
import { Film, TMDBResponse } from "@/lib/types";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q?.trim();
  const title = query ? `Search: ${query}` : "Search films & people";
  return {
    title,
    description: query
      ? `Search results for "${query}" — films and people on FilmStack.`
      : "Search for films and people on FilmStack.",
    // Search-result pages shouldn't be indexed (thin/duplicate content).
    robots: { index: false, follow: true },
  };
}

type PersonResult = {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department?: string;
};

function slugify(s: string) {
  return (s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;

  if (!q || q.trim().length < 2) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-zinc-500">
        Enter at least 2 characters to search.
      </div>
    );
  }

  const query = q.trim();

  let films: Film[] = [];
  let filmTotal = 0;
  let filmPages = 1;
  let people: PersonResult[] = [];

  try {
    const res = await tmdb.search(query, "1") as TMDBResponse<Film>;
    films = (res.results ?? []).filter((f) => !!f?.id && !!f?.title);
    filmTotal = res.total_results ?? 0;
    filmPages = res.total_pages ?? 1;
  } catch { /* show empty */ }

  try {
    const res = await tmdb.searchPeople(query, "1") as { results: PersonResult[] };
    people = (res.results ?? [])
      .filter((p) => p && typeof p.id === "number" && typeof p.name === "string")
      .slice(0, 8);
  } catch { /* show empty */ }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
      <h1 className="text-2xl font-semibold text-white">
        Results for <span className="text-zinc-400">&ldquo;{q}&rdquo;</span>
      </h1>

      {people.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">People</h2>
          <div className="flex gap-3 flex-wrap">
            {people.map((person) => (
              <Link
                key={person.id}
                href={`/people/${person.id}-${slugify(person.name)}`}
                className="flex items-center gap-3 bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 rounded-xl px-4 py-3 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-700 shrink-0 relative">
                  {person.profile_path ? (
                    <Image
                      src={`${TMDB_IMAGE_BASE}/w185${person.profile_path}`}
                      alt={person.name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-white text-sm font-medium group-hover:text-amber-400 transition-colors">{person.name}</p>
                  <p className="text-zinc-500 text-xs">{person.known_for_department ?? "Actor"}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        {people.length > 0 && (
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">Films</h2>
        )}
        <SearchResults
          initialFilms={films}
          initialTotal={filmTotal}
          initialPages={filmPages}
          query={query}
        />
      </section>
    </div>
  );
}
