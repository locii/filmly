// Pure provider-name helpers — no env, no fetch, safe to import from client
// components. Shared by the Watchmode deep-link layer (server) and the brand
// icon rendering (client).

// Collapses known provider name variants to a single canonical token, since
// TMDB and Watchmode label the same service differently
// (TMDB "Amazon Prime Video" vs Watchmode "Prime Video", etc.).
const ALIASES: Record<string, string> = {
  // Amazon: TMDB splits "Amazon Prime Video" (sub) / "Amazon Video" (buy);
  // Watchmode uses "Prime Video" / "Amazon". Collapse the family to one token.
  amazonprimevideo: "amazon",
  amazonprimevideowithads: "amazon",
  amazonvideo: "amazon",
  amazonprime: "amazon",
  primevideo: "amazon",
  // Apple: "Apple TV Store" / "Apple TV+" / iTunes all resolve to the TV app.
  appletvstore: "appletv",
  appletvplus: "appletv",
  appleitunes: "appletv",
  itunes: "appletv",
  // Misc service aliases.
  netflixstandardwithads: "netflix",
  googleplaymovies: "googleplay",
  itvplayer: "itvx",
  disney: "disneyplus",
};

// Normalises provider names so TMDB's labels line up with Watchmode's.
// e.g. "Apple TV+" -> "appletv", "Amazon Prime Video" -> "amazon"
export function normalizeProviderName(name: string): string {
  const slug = name.toLowerCase().replace(/\+/g, "plus").replace(/[^a-z0-9]/g, "");
  return ALIASES[slug] ?? slug;
}
