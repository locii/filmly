import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

interface Params {
  params: Promise<{ id: string }>;
}

// ~100 years — effectively a permanent ban until explicitly lifted.
const BAN_DURATION = "876000h";

/** Ban or unban a user. Body: { ban: boolean }. Admin only. */
export async function PATCH(request: NextRequest, { params }: Params) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authorised." }, { status: 403 });

  const { id } = await params;
  if (id === admin.id) {
    return NextResponse.json({ error: "You can't ban your own account." }, { status: 400 });
  }

  let body: { ban?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.updateUserById(id, {
    ban_duration: body.ban ? BAN_DURATION : "none",
  });
  if (error) {
    return NextResponse.json({ error: "Couldn't update the user." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, banned: !!body.ban });
}

/** Permanently delete a user (cascades their profile + interactions). Admin only. */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authorised." }, { status: 403 });

  const { id } = await params;
  if (id === admin.id) {
    return NextResponse.json({ error: "You can't delete your own account." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.deleteUser(id);
  if (error) {
    return NextResponse.json({ error: "Couldn't delete the user." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
