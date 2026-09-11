import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { findStaleUnverifiedUsers } from "@/lib/admin-cleanup";

/** Preview stale unverified users eligible for deletion. Admin only. */
export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authorised." }, { status: 403 });

  const supabase = createAdminClient();
  const users = await findStaleUnverifiedUsers(supabase);
  return NextResponse.json({ count: users.length, users });
}

/**
 * Permanently delete every stale unverified user. Eligibility is recomputed
 * server-side here (never trust the client) so this is safe to call directly.
 * Admin only.
 */
export async function POST() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authorised." }, { status: 403 });

  const supabase = createAdminClient();
  const users = await findStaleUnverifiedUsers(supabase);

  let deleted = 0;
  const failures: string[] = [];
  for (const u of users) {
    // Guard: never delete the acting admin. They've signed in, so they can't
    // match the criteria — but belt-and-braces since this is irreversible.
    if (u.id === admin.id) continue;
    const { error } = await supabase.auth.admin.deleteUser(u.id);
    if (error) failures.push(u.email ?? u.id);
    else deleted++;
  }

  return NextResponse.json({ deleted, failed: failures.length, failures });
}
