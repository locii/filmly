import SortableFilmGrid from "@/components/SortableFilmGrid";
import { tmdb } from "@/lib/tmdb";
import { Film, TMDBResponse } from "@/lib/types";

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>;
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

  let data: TMDBResponse<Film> | null = null;
  let fetchError = false;

  try {
    data = await tmdb.search(q.trim(), "1") as TMDBResponse<Film>;
  } catch (err) {
    console.error("[search] failed:", err);
    fetchError = true;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">
          Results for <span className="text-zinc-400">&ldquo;{q}&rdquo;</span>
        </h1>
        {data && data.total_results > 0 && (
          <p className="text-zinc-500 text-sm mt-1">
            {data.total_results.toLocaleString()} films found
          </p>
        )}
      </div>

      {fetchError ? (
        <div className="text-center py-16">
          <p className="text-zinc-400 mb-1">Couldn&apos;t reach the film database right now.</p>
          <p className="text-zinc-600 text-sm">TMDB may be having issues — try again in a moment.</p>
        </div>
      ) : (
        <SortableFilmGrid
          films={data?.results ?? []}
          totalPages={data?.total_pages}
          currentPage={1}
          fetchPage={async (page: number) => {
            "use server";
            try {
              const res = await tmdb.search(q!.trim(), String(page)) as TMDBResponse<Film>;
              return res.results;
            } catch {
              return [];
            }
          }}
          emptyMessage={`No films found for "${q}".`}
        />
      )}
    </div>
  );
}
