import HomeHero from "@/components/HomeHero";
import JsonLd from "@/components/JsonLd";
import StackCard, { StackCardData } from "@/components/StackCard";
import { createReadClient } from "@/lib/supabase/read";
import { SITE_URL, SITE_NAME } from "@/lib/seo";
import Link from "next/link";

// Public content — render once and revalidate hourly rather than SSR (with an
// auth round-trip) on every request. The signed-in hero is resolved client-side.
export const revalidate = 3600;

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default async function HomePage() {
  const supabase = createReadClient();
  const { data: latestStacks } = await supabase
    .from("published_stacks")
    .select("slug, query, films, created_at, author_name")
    .gt("total_titles", 0)
    .order("created_at", { ascending: false })
    .limit(6);

  const stacks = (latestStacks as StackCardData[] | null) ?? [];

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      <JsonLd data={websiteJsonLd} />
      {/* Hero */}
      <div className="text-left py-8">
        <HomeHero />
      </div>

      <hr className="border-zinc-800" />

      <div className="flex gap-4">
          <Link
            href="/genres"
            className="bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-lg transition-colors text-sm font-medium"
          >
            Browse genres
          </Link>
          <Link
            href="/recommendations"
            className="bg-brand hover:bg-zinc-700 text-white px-5 py-2.5 rounded-lg transition-colors text-sm font-medium"
          >
            Get recommendations
          </Link>
        </div>

      {/* Latest stacks */}
      {stacks.length > 0 && (
        <section>
          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-brand font-medium">Latest stacks</p>
              <h2 className="text-xl font-semibold text-white">Fresh from the community</h2>
            </div>
            <Link
              href="/stacks"
              className="shrink-0 text-sm text-brand hover:text-white transition-colors"
            >
              Browse all →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stacks.map((stack) => (
              <StackCard key={stack.slug} stack={stack} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
