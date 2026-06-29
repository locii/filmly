"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { TMDB_IMAGE_BASE } from "@/lib/tmdb";
import { Film, FollowedPerson } from "@/lib/types";
import { useFollows } from "@/context/FollowsContext";
import FilmCard from "./FilmCard";

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// One followed person: profile pic + name on the left, a horizontal overflow
// row of their latest films on the right. Films are fetched lazily.
function PersonRow({ person }: { person: FollowedPerson }) {
  const { unfollow } = useFollows();
  const [films, setFilms] = useState<Film[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/people/${person.person_id}/films`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setFilms(d.films ?? []);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => { cancelled = true; };
  }, [person.person_id]);

  const profileUrl = person.profile_path
    ? `${TMDB_IMAGE_BASE}/w185${person.profile_path}`
    : null;
  const href = `/people/${person.person_id}-${slugify(person.name)}`;
  const role = person.known_for_department === "Directing" ? "Director" : "Actor";

  return (
    <section className="border-b border-zinc-800/80 pb-8">
      <div className="flex items-center justify-between mb-4">
        <Link href={href} className="flex items-center gap-3 group">
          <div className="shrink-0 w-12 h-12 rounded-full overflow-hidden bg-zinc-800 relative">
            {profileUrl ? (
              <Image src={profileUrl} alt={person.name} fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-base font-semibold text-white group-hover:text-amber-400 transition-colors">
              {person.name}
            </h3>
            <p className="text-xs text-zinc-500">
              {films ? `${role} · ${films.length} films` : role}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3 shrink-0">
          <Link href={href} className="text-sm text-zinc-400 hover:text-white transition-colors">
            View all →
          </Link>
          <button
            onClick={() => unfollow(person.person_id)}
            title={`Unfollow ${person.name}`}
            className="text-amber-400 hover:text-zinc-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>
      </div>

      {films === null && !error ? (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shrink-0 w-36 sm:w-40 aspect-[2/3] rounded-lg bg-zinc-900 animate-pulse" />
          ))}
        </div>
      ) : error || (films && films.length === 0) ? (
        <p className="text-sm text-zinc-600">No films found.</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {films!.map((f) => (
            <div key={f.id} className="shrink-0 w-36 sm:w-40">
              <FilmCard film={f} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function FollowedPeople() {
  const { follows, isLoading } = useFollows();

  if (isLoading) {
    return <p className="text-zinc-500 text-sm">Loading…</p>;
  }

  if (follows.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-zinc-400 text-base mb-2">
          You&apos;re not following any directors or actors yet.
        </p>
        <p className="text-zinc-600 text-sm">
          Open a film, director or actor page and tap the bookmark to follow them.
        </p>
      </div>
    );
  }

  // Directors first, then actors — each group sorted by most recently followed
  // (the context already returns newest first).
  const directors = follows.filter((f) => f.known_for_department === "Directing");
  const actors = follows.filter((f) => f.known_for_department !== "Directing");

  return (
    <div className="space-y-10">
      {directors.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-5">
            Directors
          </h2>
          <div className="space-y-8">
            {directors.map((p) => <PersonRow key={p.person_id} person={p} />)}
          </div>
        </div>
      )}
      {actors.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-5">
            Actors
          </h2>
          <div className="space-y-8">
            {actors.map((p) => <PersonRow key={p.person_id} person={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
