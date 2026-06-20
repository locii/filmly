const BASE_URL = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const TIMEOUT_MS = 8000;

function getHeaders() {
  return {
    Authorization: `Bearer ${process.env.TMDB_API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

async function tmdbFetch<T>(path: string, params?: Record<string, string>, attempt = 0): Promise<T> {
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
      next: { revalidate: 3600 },
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
    return tmdbFetch<T>(path, params, attempt + 1);
  }

  if (!res.ok) {
    throw new Error(`TMDB error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export const tmdb = {
  search: (query: string, page = "1") =>
    tmdbFetch("/search/movie", { query, page, include_adult: "false" }),

  trending: (page = "1") =>
    tmdbFetch("/trending/movie/week", { page }),

  popular: (page = "1") =>
    tmdbFetch("/movie/popular", { page }),

  filmDetails: (id: number) =>
    tmdbFetch(`/movie/${id}`),

  filmVideos: (id: number) =>
    tmdbFetch(`/movie/${id}/videos`),

  filmCredits: (id: number) =>
    tmdbFetch(`/movie/${id}/credits`),

  recommendations: (id: number, page = "1") =>
    tmdbFetch(`/movie/${id}/recommendations`, { page }),

  similar: (id: number, page = "1") =>
    tmdbFetch(`/movie/${id}/similar`, { page }),

  person: (id: number) =>
    tmdbFetch(`/person/${id}`, { append_to_response: "movie_credits" }),

  genres: () =>
    tmdbFetch("/genre/movie/list"),

  byGenre: (genreId: string, page = "1") =>
    tmdbFetch("/discover/movie", {
      with_genres: genreId,
      page,
      sort_by: "popularity.desc",
      include_adult: "false",
    }),

  discover: (params: Record<string, string>, page = "1") =>
    tmdbFetch("/discover/movie", { ...params, page }),

  searchKeywords: (query: string) =>
    tmdbFetch("/search/keyword", { query }),
};
