const BASE_URL = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

const RETRYABLE = new Set([429, 500, 502, 503, 504]);

// Cache windows, by how volatile the data actually is.
//
// This is a cost lever as much as a freshness one: every distinct TMDB URL is
// its own Vercel Data Cache entry, and each entry is *rewritten* every time its
// window lapses and the URL is requested again. Under the previous blanket 1h
// window a single film page rewrote 7 entries per hour for as long as anything
// kept requesting it — which, with crawlers walking the catalogue, is forever.
//
// A 1974 film's cast, runtime and trailers do not change. Ranked lists do.
const IMMUTABLE = 2_592_000; // 30d — catalogue facts about a specific film/person
const DAILY = 86_400;        // 24h — slow-moving rankings, streaming availability
const VOLATILE = 3_600;      // 1h  — genuinely churning "what's hot right now" lists
const TIMEOUT_MS = 8000;

function getHeaders() {
  return {
    Authorization: `Bearer ${process.env.TMDB_API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

async function tmdbFetch<T>(
  path: string,
  params?: Record<string, string>,
  revalidate: number = IMMUTABLE,
  attempt = 0,
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers: getHeaders(),
      next: { revalidate },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  // Retry on transient errors (up to 2 retries, with backoff)
  if (RETRYABLE.has(res.status) && attempt < 2) {
    const delay = res.status === 429
      ? parseInt(res.headers.get("Retry-After") ?? "2", 10) * 1000
      : 500 * (attempt + 1);
    await new Promise((r) => setTimeout(r, delay));
    return tmdbFetch<T>(path, params, revalidate, attempt + 1);
  }

  if (!res.ok) {
    throw new Error(`TMDB error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export const tmdb = {
  // Default window is IMMUTABLE; only deviations are annotated below.
  search: (query: string, page = "1") =>
    tmdbFetch("/search/movie", { query, page, include_adult: "false" }, DAILY),

  searchPeople: (query: string, page = "1") =>
    tmdbFetch("/search/person", { query, page, include_adult: "false" }, DAILY),

  trending: (page = "1") =>
    tmdbFetch("/trending/movie/week", { page }, VOLATILE),

  popular: (page = "1") =>
    tmdbFetch("/movie/popular", { page }, VOLATILE),

  filmDetails: (id: number) =>
    tmdbFetch(`/movie/${id}`),

  filmVideos: (id: number) =>
    tmdbFetch(`/movie/${id}/videos`),

  filmCredits: (id: number) =>
    tmdbFetch(`/movie/${id}/credits`),

  // One call returning details + cast/crew + keywords, used to build a taste profile.
  filmProfile: (id: number) =>
    tmdbFetch(`/movie/${id}`, { append_to_response: "credits,keywords" }),

  // Streaming availability genuinely moves as licensing deals come and go.
  watchProviders: (id: number) =>
    tmdbFetch(`/movie/${id}/watch/providers`, undefined, DAILY),

  recommendations: (id: number, page = "1") =>
    tmdbFetch(`/movie/${id}/recommendations`, { page }),

  similar: (id: number, page = "1") =>
    tmdbFetch(`/movie/${id}/similar`, { page }),

  person: (id: number) =>
    tmdbFetch(`/person/${id}`, { append_to_response: "movie_credits" }),

  genres: () =>
    tmdbFetch("/genre/movie/list"),

  // Ranked by popularity, so the ordering drifts even though the catalogue doesn't.
  byGenre: (genreId: string, page = "1") =>
    tmdbFetch("/discover/movie", {
      with_genres: genreId,
      page,
      sort_by: "popularity.desc",
      include_adult: "false",
    }, DAILY),

  discover: (params: Record<string, string>, page = "1") =>
    tmdbFetch("/discover/movie", { ...params, page }, DAILY),

  searchKeywords: (query: string) =>
    tmdbFetch("/search/keyword", { query }),
};
