import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * The site is private — every route sits behind the auth gate in middleware.ts,
 * so there is nothing for a crawler to index. Disallow everything rather than
 * let bots keep discovering redirects.
 *
 * No sitemap is advertised for the same reason. If the site is ever reopened,
 * restore the per-crawler rules from git history (the blocked AI-scraper and
 * SEO-crawler lists) rather than starting from scratch.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
    host: SITE_URL,
  };
}
