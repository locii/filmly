import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Film } from "@/lib/types";

interface Params {
  params: Promise<{ slug: string }>;
}

/**
 * Update a stack's name and films. Owner only (enforced here and by RLS).
 * The slug is intentionally left unchanged so existing shared links keep working.
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
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
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("published_stacks")
    .update({
      query,
      films,
      total_titles: typeof body.totalTitles === "number" ? body.totalTitles : films.length,
      updated_at: new Date().toISOString(),
    })
    .eq("slug", slug)
    .eq("created_by", user.id)
    .select("slug")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Couldn't save — please try again." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Stack not found." }, { status: 404 });
  }

  return NextResponse.json({ slug: data.slug });
}

/** Delete a stack. Owner only (enforced here and by RLS). */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("published_stacks")
    .delete()
    .eq("slug", slug)
    .eq("created_by", user.id)
    .select("slug")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Couldn't delete — please try again." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Stack not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
