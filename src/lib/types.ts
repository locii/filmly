export interface Film {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: Genre[];
  reason?: string;        // why this was recommended, e.g. "Because you like Denis Villeneuve"
}

export interface Genre {
  id: number;
  name: string;
}

export interface Video {
  id: string;
  key: string;           // YouTube video ID
  name: string;
  site: string;          // "YouTube"
  type: string;          // "Trailer" | "Teaser" | "Clip" | "Featurette" | ...
  official: boolean;
  published_at: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface Person {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string;
  movie_credits?: {
    cast: (Film & { character: string; release_date: string })[];
    crew: (Film & { job: string; department: string; release_date: string })[];
  };
}

export interface FilmDetail extends Film {
  tagline?: string;
  runtime?: number;
  status?: string;
  genres: Genre[];
  videos?: { results: Video[] };
  credits?: { cast: CastMember[]; crew: CrewMember[] };
}

export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority: number;
}

// One country's worth of /watch/providers data
export interface WatchProviderRegion {
  link: string;            // JustWatch aggregator deep-link (required by their terms)
  flatrate?: WatchProvider[];
  free?: WatchProvider[];
  ads?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
}

export interface WatchProvidersResponse {
  id: number;
  results: Record<string, WatchProviderRegion>;
}

export interface FilmInteraction {
  id: string;
  user_id: string;
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  genre_ids: number[];
  interaction: "like" | "dislike" | "watchlist" | "watched";
  created_at: string;
}

// Lightweight shape returned by /search/person
export interface PersonResult {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  known_for: { id: number; title: string; poster_path: string | null }[];
}

export interface TMDBResponse<T> {
  results: T[];
  page: number;
  total_pages: number;
  total_results: number;
}
