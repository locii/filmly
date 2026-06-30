import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StackCard, { StackCardData } from "@/components/StackCard";
import { absoluteUrl } from "@/lib/seo";

interface Props {
  params: Promise<{ handle: string }>;
}

interface CuratorStack extends StackCardData {
  author_username: string | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COLS = "slug, query, films, created_at, author_name, author_username";

// All published stacks for one curator, resolved by handle. Falls back to the
// user id (UUID) so older /u/[id] links keep working. Stacks are publicly
// readable and carry the denormalised handle, so no profile access is needed.
async function getCuratorStacks(param: string): Promise<CuratorStack[]> {
  const supabase = await createClient();

  const byHandle = await supabase
    .from("published_stacks")
    .select(COLS)
    .eq("author_username", param.toLowerCase())
    .gt("total_titles", 0)
    .order("created_at", { ascending: false });
  if (byHandle.data && byHandle.data.length > 0) return byHandle.data as CuratorStack[];

  if (UUID_RE.test(param)) {
    const byId = await supabase
      .from("published_stacks")
      .select(COLS)
      .eq("created_by", param)
      .gt("total_titles", 0)
      .order("created_at", { ascending: false });
    return (byId.data as CuratorStack[] | null) ?? [];
  }

  return [];
}

function curatorOf(stacks: CuratorStack[]) {
  return {
    name: stacks.find((s) => s.author_name)?.author_name ?? "Anonymous",
    handle: stacks.find((s) => s.author_username)?.author_username ?? null,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const stacks = await getCuratorStacks(handle);
  if (stacks.length === 0) return { title: "Curator", robots: { index: false } };

  const { name } = curatorOf(stacks);
  const title = `${name}’s stacks`;
  const description = `${stacks.length} film ${stacks.length === 1 ? "stack" : "stacks"} curated by ${name}.`;
  const url = absoluteUrl(`/u/${handle}`);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "profile" },
  };
}

export default async function CuratorPage({ params }: Props) {
  const { handle } = await params;
  const stacks = await getCuratorStacks(handle);
  if (stacks.length === 0) notFound();

  const { name, handle: username } = curatorOf(stacks);

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-amber-500 font-medium">Curator</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white">{name}</h1>
        <p className="text-zinc-400">
          {username && <span className="text-zinc-500">@{username} · </span>}
          {stacks.length} {stacks.length === 1 ? "stack" : "stacks"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stacks.map((stack) => (
          <StackCard key={stack.slug} stack={stack} />
        ))}
      </div>
    </div>
  );
}
