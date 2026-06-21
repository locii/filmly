import { createClient } from "@/lib/supabase/server";
import { notifySignIn } from "@/lib/notify";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    const email = data?.user?.email ?? data?.session?.user?.email;
    if (email) {
      await notifySignIn(email);
    }
  }

  return NextResponse.redirect(origin);
}
