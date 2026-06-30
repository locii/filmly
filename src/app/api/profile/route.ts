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

// Validate a handle. Empty -> null (clears it). Returns an error message for
// anything that doesn't match the 3–30 char lowercase/digit/underscore rule.
function parseUsername(value: unknown): { value: string | null; error?: string } {
  if (typeof value !== "string") return { value: null };
  const handle = value.trim().toLowerCase();
  if (!handle) return { value: null };
  if (!/^[a-z0-9_]{3,30}$/.test(handle)) {
    return { value: null, error: "Handle must be 3–30 characters: lowercase letters, numbers or underscores." };
  }
  return { value: handle };
}

/** Update the signed-in user's profile, keeping stack attribution in sync. */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  let body: { username?: string; display_name?: string; bio?: string; location?: string; website?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const handle = parseUsername(body.username);
  if (handle.error) {
    return NextResponse.json({ error: handle.error }, { status: 400 });
  }

  const username = handle.value;
  const display_name = clean(body.display_name, 50);
  const bio = clean(body.bio, 280);
  const location = clean(body.location, 100);
  const website = normaliseUrl(clean(body.website, 200));

  // The signup trigger creates a profiles row for every user, so we update it
  // (needs only the existing update-own RLS policy — an upsert would also be
  // checked against an insert policy, which profiles doesn't have).
  const payload = { username, display_name, bio, location, website, updated_at: new Date().toISOString() };
  const { data: updated, error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", user.id)
    .select("id");

  if (error) {
    // 23505 = unique violation on the handle.
    if (error.code === "23505") {
      return NextResponse.json({ error: "That handle is already taken." }, { status: 409 });
    }
    return NextResponse.json({ error: "Couldn't save your profile — please try again." }, { status: 500 });
  }
  if (!updated || updated.length === 0) {
    return NextResponse.json(
      { error: "We couldn't find your profile to update. Try signing out and back in." },
      { status: 404 },
    );
  }

  // Keep the denormalised author attribution on this user's stacks current.
  // Falls back to the email's local part when the display name is cleared.
  const authorLabel = display_name || user.email?.split("@")[0] || null;
  await supabase
    .from("published_stacks")
    .update({ author_name: authorLabel, author_username: username })
    .eq("created_by", user.id);

  return NextResponse.json({ ok: true, username, display_name });
}
