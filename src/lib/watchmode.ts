// Watchmode enrichment — optional layer that supplies real per-streamer deep
// links. TMDB's /watch/providers only returns a single JustWatch aggregator
// link; Watchmode returns a `web_url` that opens the title on each service.
//
// Disabled gracefully when WATCHMODE_API_KEY is unset — callers fall back to
// the JustWatch link from TMDB.

import { normalizeProviderName } from "./providerNames";

const BASE_URL = "https://api.watchmode.com/v1";
const apiKey = process.env.WATCHMODE_API_KEY;

export const watchmodeEnabled = Boolean(apiKey);

export interface WatchmodeSource {
  source_id: number;
  name: string;
  type: "sub" | "free" | "purchase" | "rent" | "tva";
  region: string;
  web_url: string | null;
  ios_url: string | null;
  android_url: string | null;
  format: string;
  price: number | null;
}

/**
 * Returns a map of normalised provider name -> streamer deep link for one film,
 * limited to a single region. Returns an empty map when Watchmode is
 * unconfigured (callers should fall back to the TMDB/JustWatch link).
 *
 * Uses Watchmode's TMDB-ID shortcut (`movie-{tmdbId}`) so no separate lookup
 * call is needed — one request per film. Cached for 24h.
 */
export async function getWatchmodeDeepLinks(
  tmdbId: number,
  region: string,
): Promise<Record<string, string>> {
  if (!apiKey) return {};

  const url = new URL(`${BASE_URL}/title/movie-${tmdbId}/sources/`);
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("regions", region);

  const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`Watchmode error: ${res.status} ${res.statusText}`);

  const sources = (await res.json()) as WatchmodeSource[];

  const links: Record<string, string> = {};
  for (const s of sources) {
    if (s.region !== region || !s.web_url) continue;
    const key = normalizeProviderName(s.name);
    if (!links[key]) links[key] = s.web_url; // first source for a provider wins
  }
  return links;
}
