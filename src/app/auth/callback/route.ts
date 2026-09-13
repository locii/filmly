import { createClient } from "@/lib/supabase/server";
import { notifySignIn } from "@/lib/notify";
import { SITE_URL } from "@/lib/seo";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    const email = data?.user?.email ?? data?.session?.user?.email;
    if (email) {
      await notifySignIn(email);
    }
  }

  // Redirect to the canonical origin rather than the request's own origin.
  // Behind a reverse proxy the Node process sees the internal bind address
  // (0.0.0.0:3000), so deriving it from request.url sent freshly signed-in
  // users to an address that only resolves inside the server.
  return NextResponse.redirect(SITE_URL);
}
