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

  // Public-safe author label for attribution. We only have an email (magic-link
  // sign-in), so prefer a name from user metadata, else the email's local part.
  const meta = user.user_metadata ?? {};
  const authorName =
    (typeof meta.name === "string" && meta.name.trim()) ||
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    user.email?.split("@")[0] ||
    null;

  const { error } = await supabase.from("published_stacks").insert({
    slug,
    query,
    films,
    total_titles: typeof body.totalTitles === "number" ? body.totalTitles : films.length,
    created_by: user.id,
    author_name: authorName,
  });

  if (error) {
    return NextResponse.json({ error: "Couldn't publish — please try again." }, { status: 500 });
  }

  return NextResponse.json({ slug });
}
