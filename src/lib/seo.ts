import { TMDB_IMAGE_BASE } from "./tmdb";
import { Film } from "./types";

/** Canonical site origin, used for absolute URLs in metadata & JSON-LD. No trailing slash. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://film-stack.vercel.app"
).replace(/\/$/, "");

export const SITE_NAME = "FilmStack";

export interface OgImage {
  url: string;
  width: number;
  height: number;
  alt?: string;
}

/** Landscape backdrop preferred (unfurls best); falls back to the portrait poster. */
export function filmOgImage(
  film: Pick<Film, "poster_path" | "backdrop_path" | "title"> | undefined,
  alt?: string
): OgImage[] {
  if (!film) return [];
  if (film.backdrop_path) {
    return [{
      url: `${TMDB_IMAGE_BASE}/w1280${film.backdrop_path}`,
      width: 1280,
      height: 720,
      alt: alt ?? film.title,
    }];
  }
  if (film.poster_path) {
    return [{
      url: `${TMDB_IMAGE_BASE}/w780${film.poster_path}`,
      width: 780,
      height: 1170,
      alt: alt ?? film.title,
    }];
  }
  return [];
}

/** Poster image (portrait) — used where a recognisable cover is better than a backdrop. */
export function posterOgImage(path: string | null | undefined, alt?: string): OgImage[] {
  if (!path) return [];
  return [{ url: `${TMDB_IMAGE_BASE}/w780${path}`, width: 780, height: 1170, alt }];
}

/** Absolute URL for a path on this site. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
