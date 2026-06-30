import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { slugify, nextFreeSlug } from "@/lib/slug";
import { Film } from "@/lib/types";

/**
 * Create a public, shareable stack at /stacks/[slug] — either by publishing a
 * discover result (with films) or starting an empty stack from the toolbar that
 * films get added to later. Signed-in users only (enforced here and by RLS).
 * Always creates a new row; slug collisions get a numeric suffix (base, base-2…).
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in to publish." }, { status: 401 });
  }

  let body: { query?: string; films?: Film[]; totalTitles?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const query = body.query?.trim();
  const films = Array.isArray(body.films) ? body.films : [];

  if (!query) {
    return NextResponse.json({ error: "Query is required." }, { status: 400 });
  }

  const base = slugify(query);

  // Find existing slugs in this family so we can pick the next free suffix.
  const { data: existing } = await supabase
    .from("published_stacks")
    .select("slug")
    .or(`slug.eq.${base},slug.like.${base}-%`);

  const slug = nextFreeSlug(base, (existing ?? []).map((r) => r.slug as string));

  // Public-safe attribution: the user's display name + handle, falling back to
  // the email's local part for the label if they haven't set a name.
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("id", user.id)
    .maybeSingle();
  const authorName =
    (profile?.display_name as string | null)?.trim() ||
    user.email?.split("@")[0] ||
    null;
  const authorUsername = (profile?.username as string | null) ?? null;

  const { error } = await supabase.from("published_stacks").insert({
    slug,
    query,
    films,
    total_titles: typeof body.totalTitles === "number" ? body.totalTitles : films.length,
    created_by: user.id,
    author_name: authorName,
    author_username: authorUsername,
  });

  if (error) {
    return NextResponse.json({ error: "Couldn't publish — please try again." }, { status: 500 });
  }

  return NextResponse.json({ slug });
}
