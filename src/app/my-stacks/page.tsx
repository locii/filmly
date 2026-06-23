import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MyStacksList, { MyStack } from "@/components/MyStacksList";

export const metadata: Metadata = {
  title: "My stacks",
  description: "Manage the film stacks you've created.",
  robots: { index: false },
};

export default async function MyStacksPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/stacks");

  const { data } = await supabase
    .from("published_stacks")
    .select("slug, query, films, created_at")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  const stacks = (data as MyStack[] | null) ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-amber-500 font-medium">Film stacks</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">My stacks</h1>
          <p className="text-zinc-400">Edit or delete the stacks you&apos;ve published.</p>
        </div>
        <Link
          href="/stacks/new"
          className="shrink-0 bg-amber-500 hover:bg-amber-600 text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + Create stack
        </Link>
      </div>

      <MyStacksList stacks={stacks} />
    </div>
  );
}
