"use client";

import { useState } from "react";
import Image from "next/image";
import { TMDB_IMAGE_BASE } from "@/lib/tmdb";
import { CastMember } from "@/lib/types";

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Cast shown in the film page's right column. Starts collapsed to `initial`
// members and expands to the full list on demand.
export default function CastGrid({
  cast,
  initial = 8,
}: {
  cast: CastMember[];
  initial?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? cast : cast.slice(0, initial);
  const hasMore = cast.length > initial;

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-3">
        {shown.map((member) => (
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
            <p className="text-xs font-medium text-zinc-200 group-hover/cast:text-white leading-tight transition-colors line-clamp-2">{member.name}</p>
            <p className="text-xs text-zinc-500 leading-tight mt-0.5 line-clamp-2">{member.character}</p>
          </a>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          {expanded ? "Show less" : `Show all ${cast.length} cast →`}
        </button>
      )}
    </div>
  );
}
