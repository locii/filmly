import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Trim, collapse empties to null, and cap length.
function clean(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

// Ensure a website has a scheme so links work; leave null untouched.
function normaliseUrl(value: string | null): string | null {
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

/** Update the signed-in user's profile, keeping stack attribution in sync. */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  let body: { display_name?: string; bio?: string; location?: string; website?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const display_name = clean(body.display_name, 50);
  const bio = clean(body.bio, 280);
  const location = clean(body.location, 100);
  const website = normaliseUrl(clean(body.website, 200));

  // Upsert so the row exists even if the signup trigger never ran.
  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email ?? null,
        display_name,
        bio,
        location,
        website,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

  if (error) {
    return NextResponse.json({ error: "Couldn't save your profile — please try again." }, { status: 500 });
  }

  // Keep the denormalised author label on this user's stacks current. Falls back
  // to the email's local part when the display name is cleared.
  const authorLabel = display_name || user.email?.split("@")[0] || null;
  await supabase
    .from("published_stacks")
    .update({ author_name: authorLabel })
    .eq("created_by", user.id);

  return NextResponse.json({ ok: true, display_name });
}
