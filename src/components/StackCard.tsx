import Link from "next/link";
import Image from "next/image";
import { TMDB_IMAGE_BASE } from "@/lib/tmdb";
import { Film } from "@/lib/types";

export interface StackCardData {
  slug: string;
  query: string;
  films: Film[];
  created_at: string;
  author_name?: string | null;
}

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

// Compact, linkable summary of a published stack — poster, name, size, author
// and date. Shared by the home page grid and the /stacks index.
export default function StackCard({ stack }: { stack: StackCardData }) {
  const poster = stack.films.find((f) => f.poster_path)?.poster_path ?? null;

  return (
    <Link
      href={`/stacks/${stack.slug}`}
      className="group flex gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 hover:border-zinc-700 hover:bg-zinc-900/70 transition-colors"
    >
      <div className="shrink-0 w-16 aspect-[2/3] rounded-lg overflow-hidden bg-zinc-800 relative">
        {poster && (
          <Image src={`${TMDB_IMAGE_BASE}/w185${poster}`} alt="" fill className="object-cover" sizes="64px" />
        )}
      </div>
      <div className="min-w-0 flex flex-col justify-center">
        <h2 className="text-white font-medium leading-snug line-clamp-2 group-hover:text-amber-400 transition-colors">
          {stack.query}
        </h2>
        <p className="text-xs text-zinc-500 mt-1">
          {stack.films.length} films · {dateFmt.format(new Date(stack.created_at))}
        </p>
        {stack.author_name && (
          <p className="text-xs text-zinc-600 mt-0.5 truncate">by {stack.author_name}</p>
        )}
      </div>
    </Link>
  );
}
