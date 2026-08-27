import type { MetadataRoute } from "next";
import { createReadClient } from "@/lib/supabase/read";
import { tmdb } from "@/lib/tmdb";
import { absoluteUrl } from "@/lib/seo";
import { Genre } from "@/lib/types";

// Regenerate at most hourly. Previously this ran a cookie-based (dynamic) client
// plus a ≤5000-row query on *every* crawler fetch; now it's cached ISR output.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/discover"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/stacks"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/genres"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  // Genre pages (finite — ~19 from TMDB)
  let genreRoutes: MetadataRoute.Sitemap = [];
  try {
    const { genres } = (await tmdb.genres()) as { genres: Genre[] };
    genreRoutes = genres.map((g) => ({
      url: absoluteUrl(`/genres/${g.id}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    }));
  } catch {
    // TMDB unavailable — omit genre routes rather than fail the whole sitemap
  }

  // Published stacks
  let stackRoutes: MetadataRoute.Sitemap = [];
  try {
    const supabase = createReadClient();
    const { data } = await supabase
      .from("published_stacks")
      .select("slug, created_at")
      .order("created_at", { ascending: false })
      .limit(5000);
    stackRoutes = (data ?? []).map((s: { slug: string; created_at: string }) => ({
      url: absoluteUrl(`/stacks/${s.slug}`),
      lastModified: new Date(s.created_at),
      changeFrequency: "monthly",
      priority: 0.7,
    }));
  } catch {
    // DB unavailable — omit stack routes
  }

  return [...staticRoutes, ...genreRoutes, ...stackRoutes];
}
