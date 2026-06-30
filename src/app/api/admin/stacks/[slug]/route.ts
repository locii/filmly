import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

interface Params {
  params: Promise<{ slug: string }>;
}

/** Delete any stack, regardless of owner. Admin only. */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authorised." }, { status: 403 });

  const { slug } = await params;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("published_stacks")
    .delete()
    .eq("slug", slug)
    .select("slug")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Couldn't delete the stack." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Stack not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
