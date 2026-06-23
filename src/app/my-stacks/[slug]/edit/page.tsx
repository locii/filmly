import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StackEditor from "@/components/StackEditor";
import { Film } from "@/lib/types";

export const metadata = { title: "Edit stack", robots: { index: false } };

interface Props {
  params: Promise<{ slug: string }>;
}

interface StackRow {
  slug: string;
  query: string;
  films: Film[];
  created_by: string | null;
}

export default async function EditStackPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/stacks");

  const { data } = await supabase
    .from("published_stacks")
    .select("slug, query, films, created_by")
    .eq("slug", slug)
    .maybeSingle();

  const stack = data as StackRow | null;
  // Only the owner may edit; everyone else gets a 404 (don't reveal existence).
  if (!stack || stack.created_by !== user.id) notFound();

  return <StackEditor mode="edit" slug={stack.slug} initialName={stack.query} initialFilms={stack.films} />;
}
