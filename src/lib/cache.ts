// Shared Cache-Control for public, slow-changing JSON proxied from TMDB.
// Lets Vercel's CDN serve repeats (incl. bot traffic) instead of invoking the
// function every time. The TMDB fetch layer already revalidates hourly upstream.
export const PUBLIC_CACHE = "public, s-maxage=3600, stale-while-revalidate=86400";
