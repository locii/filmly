import type { MetadataRoute } from "next";
import { absoluteUrl, SITE_URL } from "@/lib/seo";

// Crawlers that walk the whole catalogue for training corpora and send back
// effectively zero referral traffic. Film pages aren't in the sitemap — they're
// discovered by following the ~20 suggestion links on every film page, which is
// an unbounded graph, so an unthrottled bot will happily pull hundreds of
// thousands of unique ids. Each of those is a cold ISR miss that renders and
// writes, which is what the traffic actually costs us.
const AI_TRAINING_BOTS = [
  "GPTBot",
  "ClaudeBot",
  "anthropic-ai",
  "Claude-Web",
  "CCBot",
  // Gemini training corpus. Documented as separate from Search — blocking this
  // does NOT affect Google Search ranking or Googlebot below.
  "Google-Extended",
  // AI training only. Plain "Applebot" is kept: it powers Siri and Spotlight.
  "Applebot-Extended",
  "meta-externalagent",
  "FacebookBot",
  "Amazonbot",
  "Bytespider",
  "Omgilibot",
  "ImagesiftBot",
  "Diffbot",
  "Timpibot",
];

// Commercial SEO/backlink crawlers. They index the catalogue for their own
// subscription products and drive no traffic here.
// NOTE: if you use Ahrefs or Semrush on this domain, their site audits need
// their own bot allowed — pull that name back out of this list.
const SEO_CRAWLERS = [
  "AhrefsBot",
  "SemrushBot",
  "DataForSeoBot",
  "MJ12bot",
  "DotBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Search results are noindex (thin/duplicate) and API routes aren't pages.
        disallow: ["/search", "/api/"],
      },
      // Kept, because they send real traffic. OAI-SearchBot and ChatGPT-User are
      // deliberately NOT in the training list — they back citations and
      // user-initiated fetches, which do refer people here.
      {
        userAgent: ["Googlebot", "Bingbot", "DuckDuckBot", "Applebot", "OAI-SearchBot", "ChatGPT-User"],
        allow: "/",
        disallow: ["/search", "/api/"],
      },
      // Cites sources and can refer traffic, but crawls hard. Throttled rather
      // than blocked — flip it into AI_TRAINING_BOTS if it stays expensive.
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: ["/search", "/api/"],
        crawlDelay: 10,
      },
      {
        userAgent: [...AI_TRAINING_BOTS, ...SEO_CRAWLERS],
        disallow: "/",
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
